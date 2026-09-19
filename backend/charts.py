"""Deterministic Vega-Lite recommendations with explicit population metadata."""
import pandas as pd


def recommend_charts(df, sample):
    numeric = [c for c in df.select_dtypes('number')
               if c != 'id' and not c.endswith('_id') and df[c].notna().any()]
    categories = [c for c in df.select_dtypes(include=['object', 'category', 'string'])
                  if c != 'id' and not c.endswith('_id') and 1 < df[c].nunique() <= 30]
    charts = []

    def add(title, mark, encoding, rows, scope):
        charts.append({
            '$schema': 'https://vega.github.io/schema/vega-lite/v5.json',
            'title': {'text': title, 'subtitle': scope},
            'width': 'container', 'height': 300,
            'data': {'values': rows}, 'mark': mark, 'encoding': encoding,
            'usermeta': {'scope': scope, 'source_rows': len(df)},
            'config': {'view': {'stroke': None}, 'bar': {'color': '#2463a0'}},
        })

    if categories:
        column = categories[0]
        counts = df[column].value_counts(dropna=False).rename_axis('category').reset_index(name='count')
        counts['category'] = counts['category'].fillna('(missing)').astype(str)
        add(f'Record count by {column}', 'bar', {
            'y': {'field': 'category', 'type': 'nominal', 'sort': '-x'},
            'x': {'field': 'count', 'type': 'quantitative', 'title': 'Records'},
            'tooltip': [{'field': 'category'}, {'field': 'count'}],
        }, counts.to_dict('records'), f'All {len(df):,} rows; missing values shown explicitly')
    if numeric:
        column = numeric[0]
        add(f'Distribution of {column}', 'bar', {
            'x': {'field': column, 'type': 'quantitative', 'bin': True},
            'y': {'aggregate': 'count', 'type': 'quantitative', 'title': 'Records'},
        }, sample, f'First {len(sample):,} of {len(df):,} rows; null measurements omitted by the chart')
    if len(numeric) >= 2:
        x, y = numeric[:2]
        add(f'{x} versus {y}', {'type': 'point', 'opacity': 0.7}, {
            'x': {'field': x, 'type': 'quantitative'},
            'y': {'field': y, 'type': 'quantitative'},
            'tooltip': [{'field': x}, {'field': y}],
        }, sample, f'First {len(sample):,} of {len(df):,} rows; descriptive association only')
    if numeric and categories:
        metric, category = numeric[0], categories[0]
        means = df.groupby(category, dropna=False)[metric].mean().rename_axis('category').reset_index(name='mean')
        means['category'] = means['category'].fillna('(missing)').astype(str)
        means = means.dropna(subset=['mean'])
        add(f'Mean {metric} by {category}', 'bar', {
            'y': {'field': 'category', 'type': 'nominal', 'sort': '-x'},
            'x': {'field': 'mean', 'type': 'quantitative'},
        }, means.to_dict('records'), f'All {len(df):,} rows; numeric nulls excluded from each group mean')
    return charts
