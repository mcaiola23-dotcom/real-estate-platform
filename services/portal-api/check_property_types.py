"""
Check property type distribution and consistency for AVM model.
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.database_url)

print('=' * 80)
print('PROPERTY TYPE ANALYSIS FOR AVM')
print('=' * 80)
print()

with engine.connect() as conn:
    # 1. Overall property type distribution in recent sales
    print('1. PROPERTY TYPE DISTRIBUTION (Recent Sales 2023-2025):')
    print('-' * 80)
    result = conn.execute(text('''
        SELECT 
            COALESCE(property_type, 'NULL/MISSING') as prop_type,
            COUNT(*) as count,
            ROUND(AVG(last_sale_price)::numeric, 2) as avg_price,
            ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY last_sale_price))::numeric, 2) as median_price,
            ROUND(MIN(last_sale_price)::numeric, 2) as min_price,
            ROUND(MAX(last_sale_price)::numeric, 2) as max_price
        FROM parcels
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date >= '2023-01-01'
        AND last_sale_price >= 50000
        GROUP BY property_type
        ORDER BY count DESC
    '''))
    
    for row in result:
        row_dict = dict(row._mapping)
        print(f"\n  {row_dict['prop_type']}:")
        print(f"    Count: {row_dict['count']:,}")
        print(f"    Avg Price: ${row_dict['avg_price']:,.0f}")
        print(f"    Median Price: ${row_dict['median_price']:,.0f}")
        print(f"    Range: ${row_dict['min_price']:,.0f} - ${row_dict['max_price']:,.0f}")
    
    print('\n')
    
    # 2. Property type by city (check consistency)
    print('2. PROPERTY TYPE BY CITY (Top 10 cities):')
    print('-' * 80)
    result = conn.execute(text('''
        SELECT 
            city,
            COUNT(*) as total_sales,
            COUNT(CASE WHEN property_type IS NULL THEN 1 END) as null_count,
            COUNT(CASE WHEN property_type = 'SingleFamily' THEN 1 END) as single_family,
            COUNT(CASE WHEN property_type = 'Condo' THEN 1 END) as condo,
            COUNT(CASE WHEN property_type = 'MultiFamily' THEN 1 END) as multi_family,
            COUNT(CASE WHEN property_type = 'Townhouse' THEN 1 END) as townhouse,
            COUNT(CASE WHEN property_type = 'Commercial' THEN 1 END) as commercial,
            COUNT(CASE WHEN property_type NOT IN ('SingleFamily', 'Condo', 'MultiFamily', 'Townhouse', 'Commercial', 'Residential') THEN 1 END) as other
        FROM parcels
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date >= '2023-01-01'
        AND last_sale_price >= 50000
        GROUP BY city
        ORDER BY total_sales DESC
        LIMIT 10
    '''))
    
    for row in result:
        row_dict = dict(row._mapping)
        print(f"\n  {row_dict['city']}:")
        print(f"    Total: {row_dict['total_sales']:,}")
        print(f"    NULL/Missing: {row_dict['null_count']:,} ({row_dict['null_count']/row_dict['total_sales']*100:.1f}%)")
        print(f"    SingleFamily: {row_dict['single_family']:,} ({row_dict['single_family']/row_dict['total_sales']*100:.1f}%)")
        print(f"    Condo: {row_dict['condo']:,} ({row_dict['condo']/row_dict['total_sales']*100:.1f}%)")
        print(f"    MultiFamily: {row_dict['multi_family']:,} ({row_dict['multi_family']/row_dict['total_sales']*100:.1f}%)")
        print(f"    Townhouse: {row_dict['townhouse']:,} ({row_dict['townhouse']/row_dict['total_sales']*100:.1f}%)")
        print(f"    Commercial: {row_dict['commercial']:,} ({row_dict['commercial']/row_dict['total_sales']*100:.1f}%)")
        print(f"    Other: {row_dict['other']:,}")
    
    print('\n')
    
    # 3. Check property_type_detail for more granular info
    print('3. PROPERTY TYPE DETAIL (Raw Classifications):')
    print('-' * 80)
    result = conn.execute(text('''
        SELECT 
            property_type_detail,
            COUNT(*) as count,
            property_type
        FROM parcels
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date >= '2023-01-01'
        AND last_sale_price >= 50000
        GROUP BY property_type_detail, property_type
        ORDER BY count DESC
        LIMIT 30
    '''))
    
    for row in result:
        row_dict = dict(row._mapping)
        detail = row_dict['property_type_detail'] or 'NULL'
        ptype = row_dict['property_type'] or 'NULL'
        print(f"  {detail[:50]:50} -> {ptype:15} ({row_dict['count']:,})")
    
    print('\n')
    
    # 4. Neighborhood coverage in recent sales
    print('4. NEIGHBORHOOD DATA COVERAGE:')
    print('-' * 80)
    result = conn.execute(text('''
        SELECT 
            COUNT(*) as total_sales,
            COUNT(neighborhood_id) as with_neighborhood,
            COUNT(*) - COUNT(neighborhood_id) as without_neighborhood,
            ROUND(COUNT(neighborhood_id)::numeric / COUNT(*) * 100, 1) as coverage_pct
        FROM parcels
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date >= '2023-01-01'
        AND last_sale_price >= 50000
    '''))
    
    row = result.fetchone()
    row_dict = dict(row._mapping)
    print(f"\n  Total Recent Sales: {row_dict['total_sales']:,}")
    print(f"  With Neighborhood: {row_dict['with_neighborhood']:,} ({row_dict['coverage_pct']}%)")
    print(f"  Without Neighborhood: {row_dict['without_neighborhood']:,} ({100-row_dict['coverage_pct']}%)")
    
    # 5. Neighborhood coverage by city
    print('\n\n5. NEIGHBORHOOD COVERAGE BY CITY:')
    print('-' * 80)
    result = conn.execute(text('''
        SELECT 
            city,
            COUNT(*) as total_sales,
            COUNT(neighborhood_id) as with_neighborhood,
            ROUND(COUNT(neighborhood_id)::numeric / COUNT(*) * 100, 1) as coverage_pct
        FROM parcels
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date >= '2023-01-01'
        AND last_sale_price >= 50000
        GROUP BY city
        ORDER BY total_sales DESC
        LIMIT 15
    '''))
    
    for row in result:
        row_dict = dict(row._mapping)
        print(f"\n  {row_dict['city']}:")
        print(f"    Total Sales: {row_dict['total_sales']:,}")
        print(f"    With Neighborhood: {row_dict['with_neighborhood']:,} ({row_dict['coverage_pct']}%)")
    
    print('\n')
    
    # 6. Check for properties with all critical features
    print('6. DATA COMPLETENESS FOR MODEL TRAINING:')
    print('-' * 80)
    result = conn.execute(text('''
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN property_type IS NOT NULL THEN 1 END) as has_property_type,
            COUNT(CASE WHEN square_feet IS NOT NULL AND square_feet > 0 THEN 1 END) as has_sqft,
            COUNT(CASE WHEN bedrooms IS NOT NULL THEN 1 END) as has_beds,
            COUNT(CASE WHEN bathrooms IS NOT NULL THEN 1 END) as has_baths,
            COUNT(CASE WHEN year_built IS NOT NULL THEN 1 END) as has_year_built,
            COUNT(CASE WHEN lot_size_acres IS NOT NULL THEN 1 END) as has_lot_size,
            COUNT(CASE WHEN zip_code IS NOT NULL THEN 1 END) as has_zip,
            COUNT(CASE WHEN 
                property_type IS NOT NULL 
                AND square_feet IS NOT NULL AND square_feet > 0
                AND bedrooms IS NOT NULL 
                AND bathrooms IS NOT NULL
                AND year_built IS NOT NULL
                AND zip_code IS NOT NULL
            THEN 1 END) as has_all_critical
        FROM parcels
        WHERE last_sale_price IS NOT NULL 
        AND last_sale_date >= '2023-01-01'
        AND last_sale_price >= 50000
    '''))
    
    row = result.fetchone()
    row_dict = dict(row._mapping)
    print(f"\n  Total Sales: {row_dict['total']:,}")
    print(f"  Has Property Type: {row_dict['has_property_type']:,} ({row_dict['has_property_type']/row_dict['total']*100:.1f}%)")
    print(f"  Has Square Feet: {row_dict['has_sqft']:,} ({row_dict['has_sqft']/row_dict['total']*100:.1f}%)")
    print(f"  Has Bedrooms: {row_dict['has_beds']:,} ({row_dict['has_beds']/row_dict['total']*100:.1f}%)")
    print(f"  Has Bathrooms: {row_dict['has_baths']:,} ({row_dict['has_baths']/row_dict['total']*100:.1f}%)")
    print(f"  Has Year Built: {row_dict['has_year_built']:,} ({row_dict['has_year_built']/row_dict['total']*100:.1f}%)")
    print(f"  Has Lot Size: {row_dict['has_lot_size']:,} ({row_dict['has_lot_size']/row_dict['total']*100:.1f}%)")
    print(f"  Has ZIP Code: {row_dict['has_zip']:,} ({row_dict['has_zip']/row_dict['total']*100:.1f}%)")
    print(f"\n  ✅ Has ALL Critical Features: {row_dict['has_all_critical']:,} ({row_dict['has_all_critical']/row_dict['total']*100:.1f}%)")

print('\n')
print('=' * 80)

