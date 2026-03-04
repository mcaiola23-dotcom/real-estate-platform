"""
Check CT GIS sales data availability for AVM training.
"""

from sqlalchemy import create_engine, text
from app.core.config import settings
from datetime import datetime

engine = create_engine(settings.database_url)

# Check recent sales data availability
queries = {
    'total_parcels': 'SELECT COUNT(*) FROM parcels',
    
    'parcels_with_last_sale': '''
        SELECT COUNT(*) 
        FROM parcels 
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date IS NOT NULL
    ''',
    
    'recent_sales_2023_2025': '''
        SELECT COUNT(*) as count, 
               MIN(last_sale_price) as min_price,
               MAX(last_sale_price) as max_price,
               AVG(last_sale_price) as avg_price,
               PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY last_sale_price) as median_price
        FROM parcels 
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date >= '2023-01-01'
        AND last_sale_price > 0
    ''',
    
    'recent_sales_2024_2025': '''
        SELECT COUNT(*) as count, 
               MIN(last_sale_price) as min_price,
               MAX(last_sale_price) as max_price,
               AVG(last_sale_price) as avg_price
        FROM parcels 
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date >= '2024-01-01'
        AND last_sale_price > 0
    ''',
    
    'sales_by_year': '''
        SELECT EXTRACT(YEAR FROM last_sale_date) as sale_year, 
               COUNT(*) as sale_count,
               AVG(last_sale_price) as avg_price
        FROM parcels 
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date IS NOT NULL
        AND last_sale_price > 0
        GROUP BY EXTRACT(YEAR FROM last_sale_date)
        ORDER BY sale_year DESC
        LIMIT 10
    ''',
    
    'sales_by_city': '''
        SELECT city, 
               COUNT(*) as sale_count,
               AVG(last_sale_price) as avg_price
        FROM parcels 
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date >= '2023-01-01'
        AND last_sale_price > 0
        GROUP BY city
        ORDER BY sale_count DESC
        LIMIT 15
    ''',
    
    'data_completeness': '''
        SELECT 
            COUNT(*) as total,
            COUNT(square_feet) as has_sqft,
            COUNT(bedrooms) as has_beds,
            COUNT(bathrooms) as has_baths,
            COUNT(year_built) as has_year_built,
            COUNT(lot_size_acres) as has_lot_size,
            COUNT(assessment_total) as has_assessment,
            COUNT(appraised_total) as has_appraisal,
            COUNT(last_sale_price) as has_sale_price,
            COUNT(neighborhood_id) as has_neighborhood
        FROM parcels
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date >= '2023-01-01'
        AND last_sale_price > 0
    '''
}

print('=' * 70)
print('CT GIS SALES DATA ANALYSIS (for AVM Training)')
print('=' * 70)
print()

with engine.connect() as conn:
    for name, query in queries.items():
        print(f'{name.upper().replace("_", " ")}:')
        result = conn.execute(text(query))
        rows = result.fetchall()
        
        if len(rows) == 1 and len(rows[0]) == 1:
            print(f'  {rows[0][0]:,}')
        else:
            for row in rows:
                row_dict = dict(row._mapping)
                for key, value in row_dict.items():
                    if isinstance(value, float):
                        print(f'  {key}: ${value:,.2f}' if 'price' in key else f'  {key}: {value:,.2f}')
                    elif isinstance(value, int):
                        print(f'  {key}: {value:,}')
                    else:
                        print(f'  {key}: {value}')
                print('  ---')
        print()

print()
print('=' * 70)
print('ASSESSMENT FOR ML MODEL TRAINING')
print('=' * 70)

with engine.connect() as conn:
    recent_count = conn.execute(text('''
        SELECT COUNT(*) FROM parcels 
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date >= '2023-01-01'
        AND last_sale_price > 0
    ''')).scalar()
    
    print(f'\nRecent sales (2023-2025): {recent_count:,}')
    print()
    
    if recent_count >= 1000:
        print('✅ EXCELLENT: Sufficient data for full ML model (1000+ sales)')
        print('   Recommendation: Proceed with Option A (Full ML with LightGBM)')
        print('   Expected Accuracy: High (MAPE < 10%)')
    elif recent_count >= 500:
        print('✅ GOOD: Adequate data for ML model (500-999 sales)')
        print('   Recommendation: Proceed with Option A, may need cross-validation')
        print('   Expected Accuracy: Good (MAPE 10-15%)')
    elif recent_count >= 200:
        print('⚠️  LIMITED: Marginal data for ML (200-499 sales)')
        print('   Recommendation: Hybrid approach or ensemble with regularization')
        print('   Expected Accuracy: Fair (MAPE 15-20%)')
    else:
        print('❌ INSUFFICIENT: Not enough data for ML (<200 sales)')
        print('   Recommendation: Use assessment-based + comparables approach')
        print('   Expected Accuracy: Moderate (MAPE 20%+)')

print()
print('=' * 70)


