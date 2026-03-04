from .properties import router as properties_router
from .leads import router as leads_router
from .health import router as health_router
from .avm import router as avm_router
from .map import router as map_router
from .search import router as search_router
from .simplyrets import router as simplyrets_router
from .listings import router as listings_router
from .cities import router as cities_router
from .ai_search import router as ai_search_router
from .commute import router as commute_router
from .places import router as places_router
from .comps import router as comps_router
from .mortgage import router as mortgage_router
from .transaction_history import router as transaction_history_router
from .auth import router as auth_router
from .saved_searches import router as saved_searches_router
from .favorites import router as favorites_router
from .users import router as users_router
from .market import router as market_router

__all__ = [
    "properties_router",
    "leads_router",
    "health_router",
    "avm_router",
    "map_router",
    "search_router",
    "simplyrets_router",
    "listings_router",
    "cities_router",
    "ai_search_router",
    "commute_router",
    "places_router",
    "comps_router",
    "mortgage_router",
    "transaction_history_router",
    "auth_router",
    "saved_searches_router",
    "favorites_router",
    "users_router",
    "market_router",
]


