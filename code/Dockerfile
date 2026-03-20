# Dockerfile de dev pour le monorepo "code/*"
FROM oven/bun:1.2.7

WORKDIR /app

# Outils utiles en local (debug/reseau)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# En développement, le code est monté par volume via docker-compose.
# On garde un démarrage simple et robuste.
CMD ["sh", "-c", "bun install && bun run dev --host 0.0.0.0"]
