"""Force fresh restart with no cache."""
import sys
import os

# Clear all cached modules related to app
for key in list(sys.modules.keys()):
    if 'app.' in key:
        del sys.modules[key]

# Now start the server
import uvicorn
from app.main import app

print("=" * 60)
print("STARTING WITH FRESH IMPORTS - NO CACHE")
print("=" * 60)

uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

