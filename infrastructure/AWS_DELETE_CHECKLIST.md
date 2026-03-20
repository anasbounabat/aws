# AWS delete checklist (STG / PRD)

> ⚠️ À conserver pendant le projet, puis **tout supprimer sous 7 jours**.

## STG

- [ ] **API Gateway** (HTTP API) exposant l’API
- [ ] **Lambda** `aws-api-stg` (ou `${PROJECT_NAME}-api-stg`)
- [ ] **Lambda** `aws-cron-backup-stg` (ou `${PROJECT_NAME}-cron-backup-stg`)
- [ ] **EventBridge Rule** `*-hourly` + **Targets**
- [ ] **CloudWatch Logs** `/aws/lambda/*-stg*`

- [ ] **RDS Postgres** (DB instance) + subnet groups + security groups associés
- [ ] **S3 buckets**
  - [ ] `${PROJECT_NAME}-user-stg`
  - [ ] `${PROJECT_NAME}-admin-stg`
  - [ ] `${PROJECT_NAME}-assets-stg`
  - [ ] `${PROJECT_NAME}-backups-stg`
- [ ] **CloudFront distributions**
  - [ ] user (stg)
  - [ ] admin (stg)
  - [ ] assets (stg)
- [ ] **CloudFront OAI/OAC** associé(e) aux origins S3

- [ ] **Cognito User Pool** (stg) + **App client**
- [ ] **SES** (identité email / domaine vérifié) + règles éventuelles

## PRD

- [ ] **API Gateway** (HTTP API) exposant l’API
- [ ] **Lambda** `aws-api-prd` (ou `${PROJECT_NAME}-api-prd`)
- [ ] **Lambda** `aws-cron-backup-prd` (ou `${PROJECT_NAME}-cron-backup-prd`)
- [ ] **EventBridge Rule** `*-hourly` + **Targets**
- [ ] **CloudWatch Logs** `/aws/lambda/*-prd*`

- [ ] **RDS Postgres** (DB instance) + subnet groups + security groups associés
- [ ] **S3 buckets**
  - [ ] `${PROJECT_NAME}-user-prd`
  - [ ] `${PROJECT_NAME}-admin-prd`
  - [ ] `${PROJECT_NAME}-assets-prd`
  - [ ] `${PROJECT_NAME}-backups-prd`
- [ ] **CloudFront distributions**
  - [ ] user (prd)
  - [ ] admin (prd)
  - [ ] assets (prd)
- [ ] **CloudFront OAI/OAC** associé(e) aux origins S3

- [ ] **Cognito User Pool** (prd) + **App client**
- [ ] **SES** (identité email / domaine vérifié) + règles éventuelles

