# 14 — Database ERD

## Entity-Relationship Diagram

```mermaid
erDiagram
    users {
        string id PK
        string name
        string email UK
        boolean isAdmin
        string image
        datetime createdAt
        datetime updatedAt
    }

    accounts {
        string provider PK
        string providerAccountId PK
        string userId FK
        string type
        string access_token
    }

    sessions {
        string sessionToken PK
        string userId FK
        datetime expires
    }

    project_providers {
        string id PK
        string displayName
        string email UK
        string whatsappNumber
        string bio
        string avatarUrl
        boolean isActive
        boolean showEmail
        boolean showWhatsapp
        boolean providerConsentConfirmed
        datetime providerConsentConfirmedAt
        datetime createdAt
        datetime updatedAt
    }

    categories {
        string id PK
        string name UK
        string slug UK
        string description
        string iconName
        int sortOrder
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    technologies {
        string id PK
        string name UK
        string slug UK
        string iconUrl
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    projects {
        string id PK
        string title
        string slug UK
        string shortDescription
        string fullDescription
        enum status
        boolean featured
        enum priceMode
        decimal price
        string demoUrl
        string projectType
        string[] whatsIncluded
        string categoryId FK
        string providerId FK
        datetime createdAt
        datetime updatedAt
    }

    project_images {
        string id PK
        string projectId FK
        string url
        string storageKey
        string altText
        boolean isPrimary
        int sortOrder
        datetime createdAt
    }

    project_features {
        string id PK
        string projectId FK
        string feature
        int sortOrder
    }

    project_specifications {
        string id PK
        string projectId FK
        string key
        string value
        int sortOrder
    }

    project_faqs {
        string id PK
        string projectId FK
        string question
        string answer
        int sortOrder
    }

    project_technologies {
        string projectId PK,FK
        string technologyId PK,FK
    }

    inquiries {
        string id PK
        string projectId FK
        string providerId FK
        string customerId FK
        string name
        string email
        string whatsapp
        string message
        enum contactMethod
        enum status
        enum notificationStatus
        string adminNotes
        datetime createdAt
        datetime updatedAt
    }

    custom_project_requests {
        string id PK
        string name
        string email
        string whatsapp
        string projectTitle
        string category
        string[] technologyPreferences
        string description
        string requiredFeatures
        string deadline
        string budget
        string additionalRequirements
        enum status
        string adminNotes
        datetime createdAt
        datetime updatedAt
    }

    site_settings {
        string key PK
        string value
        datetime updatedAt
    }

    audit_logs {
        string id PK
        string userId
        string action
        string entityType
        string entityId
        json details
        datetime createdAt
    }

    %% Auth relationships
    users ||--o{ accounts : "has"
    users ||--o{ sessions : "has"

    %% Project relationships
    project_providers ||--o{ projects : "provides"
    categories ||--o{ projects : "contains"
    projects ||--o{ project_images : "has"
    projects ||--o{ project_features : "has"
    projects ||--o{ project_specifications : "has"
    projects ||--o{ project_faqs : "has"
    projects ||--o{ project_technologies : "tagged with"
    technologies ||--o{ project_technologies : "used in"

    %% Inquiry relationships
    projects ||--o{ inquiries : "receives"
    project_providers ||--o{ inquiries : "receives"
    users |o--o{ inquiries : "submits"
```

> **V1 Scope Note:** The `favorites` table is excluded from V1 to keep the initial release lean and focused on project discovery and lead generation.

---

## Relationship Cardinality Summary

| Entity A | Relationship | Entity B | Notes |
|---|---|---|---|
| User | has many | Accounts | OAuth provider accounts |
| User | has many | Sessions | Active login sessions |
| ProjectProvider | has many | Projects | One provider → many projects |
| Project | belongs to one | ProjectProvider | One project → one provider |
| Project | belongs to one | Category | One project → one category |
| Project | has many | Technologies | Via `project_technologies` join table |
| Project | has many | ProjectImages | Ordered by sortOrder; stores storageKey |
| Project | has many | ProjectFeatures | Ordered by sortOrder |
| Project | has many | ProjectSpecifications | Ordered by sortOrder |
| Project | has many | ProjectFaqs | Ordered by sortOrder |
| Project | has many | Inquiries | All email inquiries |
| ProjectProvider | has many | Inquiries | All inquiries directed at provider |
| User | has many | Inquiries | Optional customer link for tracking |

---

## Status Enums

### ProjectStatus
```
DRAFT      ← Default; not visible to public
PUBLISHED  ← Visible on catalog (requires publication gate approval)
ARCHIVED   ← Hidden; soft-deleted and preserved in DB
```

### PriceMode
```
CONTACT       ← No price shown; contact for pricing (price = null)
FIXED         ← Specific fixed price shown (price required)
STARTING_FROM ← "Starting from ₹X,XXX" (price required)
FREE          ← Free project (price = null)
```

### InquiryStatus
```
NEW        ← Just received; not yet acted on
CONTACTED  ← Provider has been in contact
DISCUSSING ← Active discussion
QUOTED     ← Price quote sent
CLOSED     ← Conversation ended (no deal or complete)
```

### NotificationStatus
```
PENDING    ← Inquiry saved in DB, notification email queued/in-flight
SENT       ← Notification email successfully sent to provider
FAILED     ← Email sending failed; visible in admin for retry
```

### CustomRequestStatus
```
NEW         ← New request submitted
REVIEWING   ← Admin reviewing requirements
CONTACTED   ← Admin/provider contacted customer
IN_PROGRESS ← Custom project work in progress
COMPLETED   ← Request completed
DECLINED    ← Request declined
```

### ContactMethod
```
EMAIL      ← Inquiry submitted via email form
WHATSAPP   ← Customer reached out via WhatsApp
```
