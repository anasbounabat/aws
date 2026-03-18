# Infrastructure & CI/CD

Ce dossier regroupe la documentation et les fichiers d'infra / CI/CD.

## CI/CD

- Pipeline GitLab: `../.gitlab-ci.yml`
- Scripts de déploiement localement exécutables: `../scripts/deploy/`

## Environnements

- STG (staging)
- PRD (production)

## Checklist services AWS actifs (à supprimer sous 7 jours)

Maintiens une liste ici:

- [ ] API Gateway
- [ ] Lambda API (Hono + Bun)
- [ ] Lambdas Crons (backup hourly)
- [ ] EventBridge Rules (schedules)
- [ ] RDS PostgreSQL
- [ ] S3 bucket assets
- [ ] S3 bucket backups
- [ ] CloudFront user (stg/prd)
- [ ] CloudFront admin (stg/prd)
- [ ] Cognito User Pool (stg/prd)
- [ ] SES identities / verified domains
- [ ] CloudWatch log groups

