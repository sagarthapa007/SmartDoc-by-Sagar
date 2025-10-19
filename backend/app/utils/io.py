import io, pandas as pd

def read_dataframe(file_bytes: bytes, filename: str):
  name = (filename or '').lower()
  buf = io.BytesIO(file_bytes)
  if name.endswith('.csv') or name.endswith('.txt'):
    return pd.read_csv(buf)
  if name.endswith('.xlsx') or name.endswith('.xls'):
    return pd.read_excel(buf)
  return pd.read_csv(io.BytesIO(file_bytes))

def to_row_dicts(df: pd.DataFrame):
  return df.replace({pd.NA: None}).to_dict(orient='records')
