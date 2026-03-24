# ER Diagram - Chen's Notation Reference

> **Note:** Mermaid doesn't support true Chen's notation. Use the Graphviz DOT file for proper Chen's notation.
> This Mermaid diagram shows the same relationships in Crow's Foot notation for quick reference.

## Crow's Foot Notation (Mermaid)

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string email UK
        string password
        string name
        enum role
        boolean isVerified
        string otp
        date otpExpiry
        date createdAt
        date updatedAt
    }

    STUDENT {
        ObjectId _id PK,FK
        string collegeId
        string batch
        string department
        string csSection
        string googleId
    }

    FACULTY {
        ObjectId _id PK,FK
        string department
        string designation
    }

    HOD {
        ObjectId _id PK,FK
        string department
    }

    PRINCIPAL {
        ObjectId _id PK,FK
    }

    TICKET {
        ObjectId _id PK
        string ticketId UK
        string title
        text description
        enum category
        enum status
        boolean isUrgent
        string imageUrl
        text remarks
        ObjectId createdBy FK
        ObjectId assignedTo FK
        date createdAt
        date updatedAt
    }

    FEEDBACK {
        ObjectId _id PK
        string title
        text description
        enum type
        string department
        string batchYear
        string csSection
        boolean isActive
        date expiresAt
        ObjectId createdBy FK
        date createdAt
    }

    QUESTION {
        ObjectId _id PK
        ObjectId feedbackId FK
        string questionText
        enum questionType
        array options
        boolean isRequired
    }

    SUBMISSION {
        ObjectId _id PK
        ObjectId feedbackId FK
        ObjectId submittedBy FK
        date submittedAt
        string sentimentLabel
        float sentimentScore
    }

    RESPONSE {
        ObjectId _id PK
        ObjectId submissionId FK
        ObjectId questionId FK
        string answer
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId userId FK
        string title
        text message
        enum type
        boolean isRead
        date createdAt
    }

    %% Relationships
    USER ||--o| STUDENT : "ISA"
    USER ||--o| FACULTY : "ISA"
    USER ||--o| HOD : "ISA"
    USER ||--o| PRINCIPAL : "ISA"

    STUDENT ||--o{ TICKET : "creates"
    HOD ||--o{ TICKET : "assigned to"

    FACULTY ||--o{ FEEDBACK : "creates"
    FEEDBACK ||--|{ QUESTION : "has"

    STUDENT ||--o{ SUBMISSION : "submits"
    FEEDBACK ||--o{ SUBMISSION : "receives"
    SUBMISSION ||--|{ RESPONSE : "contains"
    QUESTION ||--o{ RESPONSE : "answered by"

    USER ||--o{ NOTIFICATION : "receives"
```

## Chen's Notation Legend

| Symbol | Meaning |
|--------|---------|
| Rectangle | Strong Entity |
| Double Rectangle | Weak Entity |
| Ellipse | Attribute |
| Underlined Ellipse | Key Attribute |
| Double Ellipse | Multivalued Attribute |
| Dashed Ellipse | Derived Attribute |
| Connected Ellipses | Composite Attribute |
| Diamond | Relationship |
| Double Diamond | Identifying Relationship |
| Triangle | Specialization/Generalization (ISA) |
| 1, N, M | Cardinality |
| Single Line | Partial Participation |
| Double Line | Total Participation |

## How to Render the Chen's Notation Diagram

The `er-diagram-chen.dot` file contains the full Chen's notation diagram.

```bash
# Install Graphviz if not already installed
# Ubuntu/Debian
sudo apt install graphviz

# macOS
brew install graphviz

# Windows (with chocolatey)
choco install graphviz

# Render to PNG
dot -Tpng er-diagram-chen.dot -o er-diagram-chen.png

# Render to SVG (scalable)
dot -Tsvg er-diagram-chen.dot -o er-diagram-chen.svg

# Render to PDF
dot -Tpdf er-diagram-chen.dot -o er-diagram-chen.pdf
```

---
Generated on: 2026-03-24T08:18:27.669Z
