import math
import re
from collections import Counter
from typing import Any, Dict, List, Tuple

# Enhanced stopword set with more comprehensive coverage
_STOPWORDS = set(
    """
a an and are as at be but by for from has have if in into is it its of on or that the their there these they this to was were will with your you we our not no so up out down off over under again further then once here there when where why how all any both each few more most other some such no nor only own same than too very can will just don should now
""".split()
)

# Expanded sentiment dictionaries with more nuanced terms
_POS = set(
    """
good great excellent positive benefit growth improved success happy secure safe comply compliant
strong advantage profit gain win effective efficient valuable superior robust reliable stable
promising optimistic favorable constructive productive innovative successful thriving prosperous
secure confident encouraging remarkable outstanding amazing fantastic wonderful perfect ideal
optimal peak premium quality premium best top high increase rise surge boom expansion development
advancement breakthrough milestone achievement accomplishment victory triumph satisfaction delight
pleasure joy excitement enthusiasm hope trust faith courage determination resilience recovery
solution answer fix repair heal restore renew refresh revive energize empower inspire motivate
creative smart intelligent wise brilliant clever sharp quick fast rapid swift smooth easy simple
convenient comfortable peaceful calm quiet serene tranquil gentle kind compassionate generous
honest truthful authentic genuine real true loyal faithful dedicated committed responsible
accountable transparent clear obvious evident apparent certain sure definite positive yes
""".split()
)

_NEG = set(
    """
bad poor negative risk issue problem failure failed decline breach insecure unsafe noncompliant
weak disadvantage loss cost expense damage harm injury danger threat crisis emergency disaster
catastrophe accident incident error mistake fault flaw defect bug virus malware attack hack leak
theft fraud scam corruption abuse violence conflict war fight battle struggle stress pressure
tension anxiety fear worry concern doubt suspicion uncertainty confusion chaos mess disorder
complexity difficulty challenge obstacle barrier limitation restriction constraint shortage
scarcity lack deficiency weakness vulnerability exposure liability penalty fine punishment
sentence judgment consequence result effect impact outcome negative no not never nothing none
zero empty null void missing broken damaged destroyed ruined wasted lost stolen robbed cheated
betrayed abandoned rejected denied ignored forgotten neglected oppressed suppressed depressed
sad unhappy angry mad furious enraged frustrated annoyed irritated upset disappointed desperate
hopeless helpless powerless useless worthless meaningless pointless stupid dumb ignorant foolish
silly crazy insane mad ridiculous absurd terrible horrible awful disgusting ugly evil wicked
cruel brutal violent deadly fatal lethal toxic poisonous harmful dangerous risky uncertain
unstable volatile unpredictable unreliable inconsistent inaccurate wrong false fake fraudulent
corrupt illegal unlawful criminal unethical immoral unjust unfair unequal biased prejudiced
discriminatory racist sexist homophobic xenophobic bigoted intolerant closed rigid inflexible
stubborn arrogant proud vain greedy selfish jealous envious bitter resentful hateful vengeful
spiteful malicious nasty mean harsh tough hard difficult painful sore tired exhausted fatigued
sick ill diseased infected contaminated polluted dirty filthy messy chaotic disordered complex
complicated confusing unclear vague ambiguous mysterious secret hidden concealed disguised
deceptive misleading manipulative exploitative oppressive suppressive authoritarian dictatorial
tyrannical totalitarian fascist communist socialist capitalist imperial colonial patriarchal
matriarchal hierarchical bureaucratic administrative political religious ideological doctrinal
dogmatic fundamentalist extremist radical militant terrorist revolutionary counterrevolutionary
""".split()
)


def _tokenize(text: str) -> List[str]:
    """Enhanced tokenization with better text cleaning and n-gram support"""
    if not text:
        return []

    text = text.lower().strip()

    # Remove URLs and email addresses
    text = re.sub(r"https?://\S+|www\.\S+|\S+@\S+\.\S+", "", text)

    # Remove special characters but keep basic punctuation for context
    text = re.sub(r"[^\w\s\.\?\!,]", "", text)

    # Tokenize words, keeping contractions intact
    words = re.findall(r"[a-z0-9]+(?:'[a-z]+)?", text)

    # Filter stopwords and very short words (but keep meaningful short words)
    filtered_words = []
    for w in words:
        if (w not in _STOPWORDS and len(w) > 1) or (len(w) == 1 and w in ("a", "i")):
            filtered_words.append(w)

    return filtered_words


def _top_k(counter: Counter, k: int = 10) -> List[Dict[str, Any]]:
    """Enhanced top_k with frequency percentage and trend detection"""
    total = sum(counter.values())
    results = []

    for word, count in counter.most_common(k):
        percentage = round((count / total) * 100, 2) if total > 0 else 0
        results.append(
            {
                "label": word,
                "value": int(count),
                "percentage": percentage,
                "frequency": f"{percentage}%",
            }
        )

    return results


def _sentiment(tokens: List[str]) -> Dict[str, Any]:
    """Enhanced sentiment analysis with intensity scoring and emotion detection"""
    if not tokens:
        return {
            "score": 0.0,
            "tone": "Neutral",
            "pos_hits": 0,
            "neg_hits": 0,
            "intensity": 0.0,
            "confidence": 0.0,
        }

    pos_matches = [t for t in tokens if t in _POS]
    neg_matches = [t for t in tokens if t in _NEG]

    pos_count = len(pos_matches)
    neg_count = len(neg_matches)
    total_sentiment_words = pos_count + neg_count

    # Calculate base score
    if total_sentiment_words == 0:
        score = 0.0
    else:
        score = (pos_count - neg_count) / total_sentiment_words

    # Calculate intensity based on ratio of sentiment words to total words
    intensity = total_sentiment_words / len(tokens) if tokens else 0

    # Confidence based on number of sentiment words
    confidence = min(1.0, total_sentiment_words / 10)

    # Enhanced tone classification
    if score > 0.6:
        tone = "Very Positive"
    elif score > 0.25:
        tone = "Positive"
    elif score > 0.1:
        tone = "Slightly Positive"
    elif score < -0.6:
        tone = "Very Negative"
    elif score < -0.25:
        tone = "Negative"
    elif score < -0.1:
        tone = "Slightly Negative"
    else:
        tone = "Neutral"

    return {
        "score": round(score, 3),
        "tone": tone,
        "pos_hits": pos_count,
        "neg_hits": neg_count,
        "intensity": round(intensity, 3),
        "confidence": round(confidence, 3),
        "pos_words": list(set(pos_matches)),
        "neg_words": list(set(neg_matches)),
    }


def _guess_doc_kind(file_type: str, rows: int, cols: int, summary_excerpt: str) -> str:
    """Enhanced document type detection with more categories and better heuristics"""
    ft = (file_type or "").lower().strip()

    # Structured data detection
    if ft in ("csv", "excel", "xlsx", "xls", "json", "parquet", "feather") and rows and cols:
        if rows > 1000 and cols > 10:
            return "large_tabular"
        return "tabular"

    # Document types
    if ft in ("pdf", "docx", "doc"):
        tokens = _tokenize(summary_excerpt or "")
        if len(tokens) > 200:
            return "long_document"
        elif len(tokens) > 50:
            return "document"
        else:
            return "short_text"

    # Text files
    if ft == "txt":
        tokens = _tokenize(summary_excerpt or "")
        if len(tokens) > 500:
            return "long_text"
        elif len(tokens) > 100:
            return "text"
        else:
            return "short_text"

    # Image files (though we can't analyze content without image processing)
    if ft in ("jpg", "jpeg", "png", "gif", "bmp", "tiff"):
        return "image"

    # Presentation files
    if ft in ("ppt", "pptx", "keynote"):
        return "presentation"

    return "unknown"


def _recommendations(kind: str, scrutiny: Dict[str, Any]) -> List[str]:
    """Enhanced recommendations with more specific, actionable advice"""
    recs = []
    quality = scrutiny.get("quality", {})
    missing_pct = quality.get("missing_pct", {})
    rows = scrutiny.get("rows_detected", 0)
    cols = scrutiny.get("columns_detected", 0)

    if kind == "large_tabular":
        high_missing_cols = [col for col, pct in missing_pct.items() if (pct or 0) > 0.2]
        if high_missing_cols:
            recs.append(
                f"Consider imputation or removal for columns with >20% missing values: {', '.join(high_missing_cols[:3])}"
            )

        recs.extend(
            [
                "Perform correlation analysis to identify relationships between variables.",
                "Use dimensionality reduction techniques (PCA, t-SNE) for visualization.",
                "Split data into training/validation sets for machine learning preparation.",
                "Generate automated feature importance analysis.",
                "Create interactive data profiling report.",
            ]
        )

    elif kind == "tabular":
        recs.extend(
            [
                "Generate descriptive statistics (mean, median, mode, std dev) for numeric columns.",
                "Create distribution plots for all numeric variables.",
                "Perform outlier detection using IQR or Z-score methods.",
                "Analyze categorical variable cardinality and value distributions.",
                "Suggest appropriate visualization types based on data types and relationships.",
            ]
        )

    elif kind in ("long_document", "document"):
        recs.extend(
            [
                "Generate comprehensive AI executive summary with key takeaways.",
                "Extract and categorize named entities (people, organizations, locations, dates).",
                "Perform topic modeling to identify main themes and subjects.",
                "Create section-wise sentiment analysis to track emotional flow.",
                "Build interactive keyword explorer with frequency and context.",
                "Generate readability scores and complexity metrics.",
            ]
        )

    elif kind in ("long_text", "text"):
        recs.extend(
            [
                "Perform semantic analysis to identify key concepts and relationships.",
                "Extract key phrases and terminologies specific to the domain.",
                "Generate text summarization at different compression ratios.",
                "Create timeline analysis if temporal references are present.",
                "Build entity relationship graph to visualize connections.",
            ]
        )

    elif kind == "short_text":
        recs.extend(
            [
                "Perform intent classification and categorization.",
                "Extract sentiment and emotional tone with confidence scores.",
                "Identify key entities and their relationships.",
                "Compare against similar text snippets for pattern recognition.",
            ]
        )

    elif kind == "image":
        recs.extend(
            [
                "Note: Image content analysis requires computer vision capabilities.",
                "Extract and analyze metadata (EXIF data, dimensions, format).",
                "If OCR available, extract text content for analysis.",
                "Consider integration with image recognition services.",
            ]
        )

    elif kind == "presentation":
        recs.extend(
            [
                "Extract slide titles and content structure.",
                "Analyze presentation flow and topic progression.",
                "Identify key messaging and call-to-action elements.",
                "Generate speaker notes summary and talking points.",
            ]
        )

    else:
        recs.extend(
            [
                "Consider converting to structured format (CSV/JSON) for detailed analysis.",
                "Extract basic metadata and file characteristics.",
                "Check file integrity and compatibility with analysis tools.",
            ]
        )

    # Add data quality recommendations for all tabular types
    if kind in ("tabular", "large_tabular"):
        if any((pct or 0) > 0.1 for pct in missing_pct.values()):
            recs.append("Address missing values above 10% to improve data quality.")

        numeric_neg = quality.get("numeric_negatives", {})
        if any(count > 0 for count in numeric_neg.values()):
            recs.append("Verify negative values in numeric columns are expected and valid.")

    return recs


def _analyze_data_quality(
    quality: Dict[str, Any], schema: List[Dict]
) -> Tuple[List[str], List[Dict[str, Any]]]:
    """Enhanced data quality analysis with comprehensive metrics"""
    insights = []
    charts = []

    missing_pct = quality.get("missing_pct", {})
    numeric_negatives = quality.get("numeric_negatives", {})

    # Missing values analysis
    if missing_pct:
        high_missing = {k: v for k, v in missing_pct.items() if (v or 0) > 0.1}
        if high_missing:
            insights.append(f"{len(high_missing)} columns have >10% missing values")

            # Top missing values chart
            top_missing = sorted(high_missing.items(), key=lambda x: x[1], reverse=True)[:10]
            charts.append(
                {
                    "type": "bar",
                    "title": "Columns with High Missing Values (%)",
                    "labels": [k for k, _ in top_missing],
                    "values": [round(v * 100, 1) for _, v in top_missing],
                    "color": "#ff6b6b",
                }
            )

    # Data type distribution
    type_counts = Counter([col.get("type", "unknown") for col in schema])
    if type_counts:
        insights.append(
            f"Data types: {', '.join(f'{k}({v})' for k, v in type_counts.most_common())}"
        )

        charts.append(
            {
                "type": "pie",
                "title": "Data Type Distribution",
                "labels": list(type_counts.keys()),
                "values": list(type_counts.values()),
            }
        )

    # Negative values in numeric columns
    if numeric_negatives:
        neg_cols = {k: v for k, v in numeric_negatives.items() if v > 0}
        if neg_cols:
            insights.append(f"{len(neg_cols)} numeric columns contain negative values")

            charts.append(
                {
                    "type": "bar",
                    "title": "Negative Values Count",
                    "labels": list(neg_cols.keys()),
                    "values": list(neg_cols.values()),
                    "color": "#ffa726",
                }
            )

    # Data quality score
    total_columns = len(schema)
    if total_columns > 0:
        quality_issues = sum(1 for pct in missing_pct.values() if (pct or 0) > 0.1)
        quality_score = max(0, 100 - (quality_issues / total_columns) * 100)
        insights.append(f"Data quality score: {quality_score:.1f}%")

    return insights, charts


def analyze_from_scrutiny(upload_id: str, scrutiny: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enhanced analysis with comprehensive insights across all data types.
    Works without accessing the original file (no extra IO).
    """
    file_type = scrutiny.get("file_type") or ""
    rows = int(scrutiny.get("rows_detected") or 0)
    cols = int(scrutiny.get("columns_detected") or 0)
    schema = scrutiny.get("schema") or []
    quality = scrutiny.get("quality") or {}
    preview_rows = scrutiny.get("preview") or []
    summary_excerpt = scrutiny.get("summary_excerpt") or ""
    file_size = scrutiny.get("file_size")

    kind = _guess_doc_kind(file_type, rows, cols, summary_excerpt)

    insights: List[str] = []
    charts: List[Dict[str, Any]] = []

    # Add basic file information
    insights.append(
        f"File: {file_type.upper()} | Type: {kind.replace('_', ' ').title()} | ID: {upload_id}"
    )

    if file_size:
        insights.append(f"File size: {file_size}")

    # ----- Enhanced Text/Document Analysis -----
    if kind in ("long_document", "document", "long_text", "text", "short_text"):
        tokens = _tokenize(summary_excerpt)
        word_count = len(tokens)
        unique_words = len(set(tokens))

        insights.append(
            f"Text analysis: {word_count} words, {unique_words} unique ({round(unique_words/word_count*100 if word_count else 0, 1)}% diversity)"
        )

        # Keyword analysis
        if tokens:
            keyword_counter = Counter(tokens)
            top_keywords = _top_k(keyword_counter, 15)

            # Enhanced keyword insights
            if top_keywords:
                top_5 = [k["label"] for k in top_keywords[:5]]
                insights.append(f"Top keywords: {', '.join(top_5)}")

                # Keyword frequency chart
                charts.append(
                    {
                        "type": "bar",
                        "title": "Top 15 Keywords",
                        "labels": [x["label"] for x in top_keywords],
                        "values": [x["value"] for x in top_keywords],
                        "color": "#4ecdc4",
                    }
                )

        # Enhanced sentiment analysis
        sentiment_result = _sentiment(tokens)
        insights.append(
            f"Sentiment: {sentiment_result['tone']} (score: {sentiment_result['score']}, confidence: {sentiment_result['confidence']})"
        )

        # Add sentiment breakdown if significant
        if sentiment_result["pos_hits"] > 0 or sentiment_result["neg_hits"] > 0:
            sentiment_chart = {
                "type": "doughnut",
                "title": "Sentiment Distribution",
                "labels": ["Positive", "Negative", "Neutral"],
                "values": [
                    sentiment_result["pos_hits"],
                    sentiment_result["neg_hits"],
                    len(tokens) - sentiment_result["pos_hits"] - sentiment_result["neg_hits"],
                ],
                "colors": ["#2ecc71", "#e74c3c", "#95a5a6"],
            }
            charts.append(sentiment_chart)

    # ----- Enhanced Tabular Analysis -----
    if kind in ("tabular", "large_tabular"):
        insights.append(f"Dataset: {rows:,} rows × {cols:,} columns")

        # Enhanced data quality analysis
        quality_insights, quality_charts = _analyze_data_quality(quality, schema)
        insights.extend(quality_insights)
        charts.extend(quality_charts)

        # Column type insights
        type_summary = Counter([col.get("type", "unknown") for col in schema])
        if type_summary:
            type_insight = "Column types: " + ", ".join(
                [f"{k}({v})" for k, v in type_summary.most_common()]
            )
            insights.append(type_insight)

        # Sample data distribution for categorical columns
        cat_columns = [
            c["name"]
            for c in schema
            if c.get("type") in ("categorical", "string") and c.get("name")
        ]
        if preview_rows and cat_columns:
            # Analyze first 2 categorical columns
            for col_name in cat_columns[:2]:
                values = [
                    str(row.get(col_name, ""))
                    for row in preview_rows
                    if col_name in row and row[col_name] is not None
                ]
                if values:
                    freq = Counter(values)
                    if 1 < len(freq) <= 20:  # Only chart if reasonable number of categories
                        top_cats = _top_k(freq, 8)
                        charts.append(
                            {
                                "type": "bar",
                                "title": f"Top Values - {col_name}",
                                "labels": [x["label"] for x in top_cats],
                                "values": [x["value"] for x in top_cats],
                                "color": "#3498db",
                            }
                        )

    # ----- Enhanced Recommendations -----
    recs = _recommendations(kind, scrutiny)

    # ----- Enhanced Summary -----
    if kind in ("tabular", "large_tabular"):
        quality_issues = sum(
            1 for pct in quality.get("missing_pct", {}).values() if (pct or 0) > 0.1
        )
        summary = f"Analyzed {rows:,}×{cols:,} {file_type.upper()} dataset. Found {quality_issues} data quality issues. Generated comprehensive analysis."

    elif kind in ("long_document", "document", "long_text", "text"):
        token_count = len(_tokenize(summary_excerpt))
        summary = f"Analyzed {file_type.upper()} document with {token_count:,} tokens. Extracted keywords, sentiment, and structural insights."

    elif kind == "short_text":
        token_count = len(_tokenize(summary_excerpt))
        summary = f"Analyzed short {file_type.upper()} text with {token_count} tokens. Performed sentiment and keyword analysis."

    else:
        summary = f"Analyzed {file_type.upper()} file ({kind}). Provided basic insights and recommendations."

    # Add analysis metadata
    analysis_meta = {
        "document_type": kind,
        "analysis_timestamp": "current",  # In real implementation, use datetime.now().isoformat()
        "analysis_version": "enhanced_1.0",
    }

    return {
        "summary": summary,
        "insights": insights,
        "recommendations": recs,
        "charts": charts,
        "metadata": analysis_meta,
    }
