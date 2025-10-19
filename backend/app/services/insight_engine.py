import math
def looks_like_date_header(h): return any(k in str(h or '').lower() for k in ['date','day','time','timestamp','created','modified','month','year'])
def detect_column_type(values, header):
  nums=dates=total=0
  for v in values:
    if v in (None,''): continue
    total+=1
    try:
      n=float(str(v).replace(',',''))
      if math.isfinite(n): nums+=1; continue
    except: pass
    if looks_like_date_header(header): dates+=1
  if total==0: return 'category'
  if nums/total>0.7: return 'number'
  if dates/total>0.7: return 'date'
  return 'category'
def summarize_numeric(values):
  vals=[]
  for v in values:
    if v in (None,''): continue
    try:
      n=float(v)
      if math.isfinite(n): vals.append(n)
    except: pass
  n=len(vals)
  if not n: return dict(n=0,mean=None,std=None,min=None,max=None,q1=None,q3=None,iqr=None)
  vals.sort()
  mean=sum(vals)/n
  variance=sum((x-mean)**2 for x in vals)/n
  std=math.sqrt(variance)
  def q(p):
    if n==1: return vals[0]
    idx=(n-1)*p
    lo=math.floor(idx); hi=math.ceil(idx)
    return vals[lo] if lo==hi else vals[lo]+(vals[hi]-vals[lo])*(idx-lo)
  q1,q3=q(0.25),q(0.75)
  return dict(n=n,mean=mean,std=std,min=vals[0],max=vals[-1],q1=q1,q3=q3,iqr=q3-q1)
def pearson(x_raw,y_raw):
  x=[]; y=[]
  for a,b in zip(x_raw,y_raw):
    if a in (None,'') or b in (None,''): continue
    try:
      na=float(a); nb=float(b)
      if math.isfinite(na) and math.isfinite(nb): x.append(na); y.append(nb)
    except: pass
  n=len(x)
  if n<3: return None
  mx=sum(x)/n; my=sum(y)/n
  num=sum((xi-mx)*(yi-my) for xi,yi in zip(x,y))
  dx=sum((xi-mx)**2 for xi in x); dy=sum((yi-my)**2 for yi in y)
  den=math.sqrt(dx*dy)
  if den==0: return None
  return num/den
def top_n(lst,n,key): return sorted(lst,key=key,reverse=True)[:n]
def value_counts(values):
  out={}
  for v in values:
    key='__MISSING__' if v in (None,'') else str(v)
    out[key]=out.get(key,0)+1
  return out
def compute_insights(rows,max_cells=200000):
  if not rows:
    return dict(summary=dict(rows=0,columns=0,numericColumns=0,categoricalColumns=0,dateColumns=0),schema=[],numericStats=[],categoricalStats=[],correlations=[],insights=[])
  headers=list(rows[0].keys())
  cols=[[r.get(h,'') for r in rows] for h in headers]
  cell_count=len(rows)*len(headers)
  if cell_count>max_cells:
    step=math.ceil(cell_count/max_cells)
    cols=[[v for i,v in enumerate(col) if i%step==0] for col in cols]
  schema=[]
  for h,values in zip(headers,cols):
    ctype=detect_column_type(values,h)
    missing=sum(1 for v in values if v in (None,''))
    schema.append(dict(header=h,type=ctype,missing=missing,missingPct=missing/max(1,len(values)),sampleSize=len(values)))
  numeric_stats=[]
  for col in schema:
    if col['type']!='number': continue
    values=cols[headers.index(col['header'])]
    stats=summarize_numeric(values)
    outliers=0
    if stats['n']>0 and stats['iqr'] is not None:
      lo=stats['q1']-1.5*stats['iqr']; hi=stats['q3']+1.5*stats['iqr']
      for v in values:
        try:
          n=float(v)
          if math.isfinite(n) and (n<lo or n>hi): outliers+=1
        except: pass
    stats.update(dict(column=col['header'],outliers=outliers))
    numeric_stats.append(stats)
  categorical_stats=[]
  for col in schema:
    if col['type']!='category': continue
    values=cols[headers.index(col['header'])]
    counts=value_counts(values); total=len(values)
    pairs=[(k,v) for k,v in counts.items() if k!='__MISSING__']; pairs.sort(key=lambda kv:kv[1],reverse=True)
    top5=pairs[:5]; dominant=(top5[0][1]/total) if top5 else 0
    categorical_stats.append(dict(column=col['header'],total=total,uniques=len(counts),dominant=dominant,top5=[dict(value=k,count=v,pct=v/total) for k,v in top5]))
  num_cols=[c['header'] for c in schema if c['type']=='number']
  corrs=[]
  for i in range(len(num_cols)):
    for j in range(i+1,len(num_cols)):
      A=cols[headers.index(num_cols[i])]; B=cols[headers.index(num_cols[j])]
      r=pearson(A,B)
      if r is not None: corrs.append(dict(a=num_cols[i],b=num_cols[j],r=float(r),strength=abs(r)))
  corrs=top_n(corrs,10,key=lambda x:abs(x['r']))
  insights=[]
  for c in schema:
    if c['missingPct']>=0.2:
      insights.append(dict(id=f"missing-{c['header']}",type='missing',severity='high' if c['missingPct']>=0.5 else 'medium',title=f'High missing values in “{c["header"]}”',detail=f"{c['missingPct']*100:.1f}% of rows missing"))
  for s in numeric_stats:
    if s['n']>0 and s['outliers']>0:
      sev='high' if (s['outliers']/max(1,s['n']))>0.05 else 'low'
      insights.append(dict(id=f"outliers-{s['column']}",type='outlier',severity=sev,title=f'Outliers in “{s["column"]}”',detail=f"{s['outliers']} outliers detected via IQR"))
  for s in categorical_stats:
    if s['uniques']>1 and s['dominant']>=0.8:
      insights.append(dict(id=f"imbalance-{s['column']}",type='imbalance',severity='medium',title=f'Imbalanced categories in “{s["column"]}”',detail=f"Top category holds {s['dominant']*100:.1f}% share"))
  for c in corrs:
    if abs(c['r'])>=0.7:
      insights.append(dict(id=f"corr-{c['a']}-{c['b']}",type='correlation',severity='high' if abs(c['r'])>=0.9 else 'medium',title=f"Strong correlation ({c['r']:.2f})",detail=f"“{c['a']}” vs “{c['b']}”"))
  summary=dict(rows=len(rows),columns=len(headers),numericColumns=len(num_cols),categoricalColumns=sum(1 for s in schema if s['type']=='category'),dateColumns=sum(1 for s in schema if s['type']=='date'))
  return dict(summary=summary,schema=schema,numericStats=numeric_stats,categoricalStats=categorical_stats,correlations=corrs,insights=insights)
