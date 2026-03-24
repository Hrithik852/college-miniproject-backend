#!/usr/bin/env node
/**
 * ER Diagram Generator (Chen's Notation) for College Miniproject Backend
 *
 * Generates ER diagrams in Chen's notation using Graphviz DOT format
 *
 * Usage:
 *   node scripts/generate-er-diagram.js
 *   node scripts/generate-er-diagram.js --output er-diagram.dot
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const outputFile = args.includes('--output')
    ? args[args.indexOf('--output') + 1]
    : 'er-diagram-chen';

// Database schema analysis from models
const schema = {
    entities: [
        {
            name: 'USER',
            attributes: [
                { name: '_id', type: 'PK', isKey: true },
                { name: 'email', type: 'string', isKey: true, isUnique: true },
                { name: 'password', type: 'string', isDerived: false },
                { name: 'name', type: 'string' },
                { name: 'role', type: 'enum' },
                { name: 'isVerified', type: 'boolean' },
                { name: 'otp', type: 'string', isMultivalued: false },
                { name: 'otpExpiry', type: 'date' },
                { name: 'createdAt', type: 'date' },
                { name: 'updatedAt', type: 'date' }
            ]
        },
        {
            name: 'STUDENT',
            isWeak: false,
            inheritsFrom: 'USER',
            attributes: [
                { name: 'collegeId', type: 'string' },
                { name: 'batch', type: 'string' },
                { name: 'department', type: 'string' },
                { name: 'csSection', type: 'string' },
                { name: 'googleId', type: 'string' }
            ]
        },
        {
            name: 'FACULTY',
            inheritsFrom: 'USER',
            attributes: [
                { name: 'department', type: 'string' },
                { name: 'designation', type: 'string' }
            ]
        },
        {
            name: 'HOD',
            inheritsFrom: 'USER',
            attributes: [
                { name: 'department', type: 'string' }
            ]
        },
        {
            name: 'PRINCIPAL',
            inheritsFrom: 'USER',
            attributes: []
        },
        {
            name: 'TICKET',
            attributes: [
                { name: '_id', type: 'PK', isKey: true },
                { name: 'ticketId', type: 'string', isKey: true, isUnique: true },
                { name: 'title', type: 'string' },
                { name: 'description', type: 'text' },
                { name: 'category', type: 'enum' },
                { name: 'status', type: 'enum' },
                { name: 'isUrgent', type: 'boolean' },
                { name: 'imageUrl', type: 'string' },
                { name: 'remarks', type: 'text' },
                { name: 'createdAt', type: 'date' },
                { name: 'updatedAt', type: 'date' }
            ]
        },
        {
            name: 'FEEDBACK',
            attributes: [
                { name: '_id', type: 'PK', isKey: true },
                { name: 'title', type: 'string' },
                { name: 'description', type: 'text' },
                { name: 'type', type: 'enum' },
                { name: 'department', type: 'string' },
                { name: 'batchYear', type: 'string' },
                { name: 'csSection', type: 'string' },
                { name: 'isActive', type: 'boolean' },
                { name: 'expiresAt', type: 'date' },
                { name: 'createdAt', type: 'date' }
            ]
        },
        {
            name: 'QUESTION',
            isWeak: true,
            ownerEntity: 'FEEDBACK',
            attributes: [
                { name: 'questionId', type: 'PK', isKey: true, isPartial: true },
                { name: 'questionText', type: 'string' },
                { name: 'questionType', type: 'enum' },
                { name: 'options', type: 'array', isMultivalued: true },
                { name: 'isRequired', type: 'boolean' }
            ]
        },
        {
            name: 'SUBMISSION',
            attributes: [
                { name: '_id', type: 'PK', isKey: true },
                { name: 'submittedAt', type: 'date' },
                { name: 'sentiment', type: 'composite', components: ['label', 'score'] }
            ]
        },
        {
            name: 'RESPONSE',
            isWeak: true,
            ownerEntity: 'SUBMISSION',
            attributes: [
                { name: 'questionId', type: 'FK', isKey: true, isPartial: true },
                { name: 'answer', type: 'string' }
            ]
        },
        {
            name: 'NOTIFICATION',
            attributes: [
                { name: '_id', type: 'PK', isKey: true },
                { name: 'title', type: 'string' },
                { name: 'message', type: 'text' },
                { name: 'type', type: 'enum' },
                { name: 'isRead', type: 'boolean' },
                { name: 'createdAt', type: 'date' }
            ]
        }
    ],

    relationships: [
        {
            name: 'CREATES',
            entity1: 'STUDENT',
            entity2: 'TICKET',
            cardinality: '1:N',
            participation1: 'partial',
            participation2: 'total'
        },
        {
            name: 'ASSIGNED_TO',
            entity1: 'TICKET',
            entity2: 'HOD',
            cardinality: 'N:1',
            participation1: 'partial',
            participation2: 'partial'
        },
        {
            name: 'CREATES_FORM',
            entity1: 'FACULTY',
            entity2: 'FEEDBACK',
            cardinality: '1:N',
            participation1: 'partial',
            participation2: 'total'
        },
        {
            name: 'HAS',
            entity1: 'FEEDBACK',
            entity2: 'QUESTION',
            cardinality: '1:N',
            participation1: 'total',
            participation2: 'total',
            isIdentifying: true
        },
        {
            name: 'SUBMITS',
            entity1: 'STUDENT',
            entity2: 'SUBMISSION',
            cardinality: '1:N',
            participation1: 'partial',
            participation2: 'total'
        },
        {
            name: 'FOR',
            entity1: 'SUBMISSION',
            entity2: 'FEEDBACK',
            cardinality: 'N:1',
            participation1: 'total',
            participation2: 'partial'
        },
        {
            name: 'CONTAINS',
            entity1: 'SUBMISSION',
            entity2: 'RESPONSE',
            cardinality: '1:N',
            participation1: 'total',
            participation2: 'total',
            isIdentifying: true
        },
        {
            name: 'ANSWERS',
            entity1: 'RESPONSE',
            entity2: 'QUESTION',
            cardinality: 'N:1',
            participation1: 'total',
            participation2: 'partial'
        },
        {
            name: 'RECEIVES',
            entity1: 'USER',
            entity2: 'NOTIFICATION',
            cardinality: '1:N',
            participation1: 'partial',
            participation2: 'total'
        },
        {
            name: 'ISA_STUDENT',
            entity1: 'USER',
            entity2: 'STUDENT',
            type: 'specialization'
        },
        {
            name: 'ISA_FACULTY',
            entity1: 'USER',
            entity2: 'FACULTY',
            type: 'specialization'
        },
        {
            name: 'ISA_HOD',
            entity1: 'USER',
            entity2: 'HOD',
            type: 'specialization'
        },
        {
            name: 'ISA_PRINCIPAL',
            entity1: 'USER',
            entity2: 'PRINCIPAL',
            type: 'specialization'
        }
    ]
};

// Generate Graphviz DOT for Chen's Notation
function generateChenDOT() {
    let dot = `// ER Diagram - Chen's Notation
// College Feedback & Ticket Management System
// Generated: ${new Date().toISOString()}
//
// To render: dot -Tpng er-diagram-chen.dot -o er-diagram-chen.png
//        or: dot -Tsvg er-diagram-chen.dot -o er-diagram-chen.svg

digraph ER {
    // Graph settings
    graph [
        rankdir=TB,
        splines=ortho,
        nodesep=0.8,
        ranksep=1.2,
        fontname="Arial",
        fontsize=12,
        label="\\nER Diagram - Chen's Notation\\nCollege Feedback & Ticket Management System\\n",
        labelloc=t,
        pad=0.5
    ];
    node [fontname="Arial", fontsize=10];
    edge [fontname="Arial", fontsize=9];

    // ==========================================
    // ENTITY DEFINITIONS (Rectangles)
    // ==========================================

    // Strong Entities (Regular rectangles)
    node [shape=box, style=filled, fillcolor="#a5d6a7", color="#2e7d32", penwidth=2];
    USER [label="USER"];
    TICKET [label="TICKET"];
    FEEDBACK [label="FEEDBACK"];
    SUBMISSION [label="SUBMISSION"];
    NOTIFICATION [label="NOTIFICATION"];

    // Weak Entities (Double-bordered rectangles)
    node [shape=box, style=filled, fillcolor="#ffcc80", color="#e65100", penwidth=2, peripheries=2];
    QUESTION [label="QUESTION"];
    RESPONSE [label="RESPONSE"];

    // Subtype Entities (for specialization)
    node [shape=box, style=filled, fillcolor="#b3e5fc", color="#0277bd", penwidth=2, peripheries=1];
    STUDENT [label="STUDENT"];
    FACULTY [label="FACULTY"];
    HOD [label="HOD"];
    PRINCIPAL [label="PRINCIPAL"];

    // ==========================================
    // ATTRIBUTE DEFINITIONS (Ellipses)
    // ==========================================

    // --- USER Attributes ---
    node [shape=ellipse, style=filled, fillcolor="#fff9c4", color="#f9a825", penwidth=1, peripheries=1];

    // Key attribute (underlined via HTML label)
    USER_id [label=<<U>_id</U>>];
    USER_email [label=<<U>email</U>>];
    USER_password [label="password"];
    USER_name [label="name"];
    USER_role [label="role"];
    USER_isVerified [label="isVerified"];
    USER_createdAt [label="createdAt"];

    // --- STUDENT Attributes ---
    STU_collegeId [label="collegeId"];
    STU_batch [label="batch"];
    STU_department [label="department"];
    STU_csSection [label="csSection"];
    STU_googleId [label="googleId"];

    // --- FACULTY Attributes ---
    FAC_department [label="department"];
    FAC_designation [label="designation"];

    // --- HOD Attributes ---
    HOD_department [label="department"];

    // --- TICKET Attributes ---
    TKT_id [label=<<U>_id</U>>];
    TKT_ticketId [label=<<U>ticketId</U>>];
    TKT_title [label="title"];
    TKT_description [label="description"];
    TKT_category [label="category"];
    TKT_status [label="status"];
    TKT_isUrgent [label="isUrgent"];
    TKT_imageUrl [label="imageUrl"];
    TKT_remarks [label="remarks"];
    TKT_createdAt [label="createdAt"];

    // --- FEEDBACK Attributes ---
    FB_id [label=<<U>_id</U>>];
    FB_title [label="title"];
    FB_description [label="description"];
    FB_type [label="type"];
    FB_department [label="department"];
    FB_batchYear [label="batchYear"];
    FB_csSection [label="csSection"];
    FB_isActive [label="isActive"];
    FB_expiresAt [label="expiresAt"];

    // --- QUESTION Attributes (Weak Entity - partial key)
    // Partial key shown with dashed underline
    node [shape=ellipse, style=filled, fillcolor="#ffecb3", color="#ff8f00", penwidth=1];
    Q_questionId [label=<<U>questionId</U>>];
    Q_questionText [label="questionText"];
    Q_questionType [label="questionType"];
    // Multivalued attribute (double ellipse)
    node [peripheries=2];
    Q_options [label="options"];
    node [peripheries=1];
    Q_isRequired [label="isRequired"];

    // --- SUBMISSION Attributes ---
    node [shape=ellipse, style=filled, fillcolor="#fff9c4", color="#f9a825", penwidth=1];
    SUB_id [label=<<U>_id</U>>];
    SUB_submittedAt [label="submittedAt"];
    // Composite attribute
    node [shape=ellipse, style=filled, fillcolor="#e1bee7", color="#7b1fa2"];
    SUB_sentiment [label="sentiment"];
    SUB_sent_label [label="label"];
    SUB_sent_score [label="score"];

    // --- RESPONSE Attributes (Weak Entity)
    node [shape=ellipse, style=filled, fillcolor="#ffecb3", color="#ff8f00", penwidth=1];
    RESP_questionId [label=<<U>questionId</U>>];
    RESP_answer [label="answer"];

    // --- NOTIFICATION Attributes ---
    node [shape=ellipse, style=filled, fillcolor="#fff9c4", color="#f9a825", penwidth=1];
    NOT_id [label=<<U>_id</U>>];
    NOT_title [label="title"];
    NOT_message [label="message"];
    NOT_type [label="type"];
    NOT_isRead [label="isRead"];
    NOT_createdAt [label="createdAt"];

    // ==========================================
    // RELATIONSHIP DEFINITIONS (Diamonds)
    // ==========================================

    // Regular relationships (single diamond)
    node [shape=diamond, style=filled, fillcolor="#ef9a9a", color="#c62828", penwidth=2, peripheries=1];
    REL_CREATES [label="CREATES"];
    REL_ASSIGNED [label="ASSIGNED\\nTO"];
    REL_CREATES_FORM [label="CREATES\\nFORM"];
    REL_SUBMITS [label="SUBMITS"];
    REL_FOR [label="FOR"];
    REL_ANSWERS [label="ANSWERS"];
    REL_RECEIVES [label="RECEIVES"];

    // Identifying relationships (double diamond)
    node [shape=diamond, style=filled, fillcolor="#ffab91", color="#d84315", penwidth=2, peripheries=2];
    REL_HAS [label="HAS"];
    REL_CONTAINS [label="CONTAINS"];

    // Specialization/Generalization (Triangle/Circle)
    node [shape=triangle, style=filled, fillcolor="#b0bec5", color="#37474f", penwidth=2, peripheries=1];
    ISA [label="ISA"];

    // ==========================================
    // CONNECT ATTRIBUTES TO ENTITIES
    // ==========================================

    edge [style=solid, color="#666666", penwidth=1, arrowhead=none];

    // USER attributes
    USER -> USER_id;
    USER -> USER_email;
    USER -> USER_password;
    USER -> USER_name;
    USER -> USER_role;
    USER -> USER_isVerified;
    USER -> USER_createdAt;

    // STUDENT attributes
    STUDENT -> STU_collegeId;
    STUDENT -> STU_batch;
    STUDENT -> STU_department;
    STUDENT -> STU_csSection;
    STUDENT -> STU_googleId;

    // FACULTY attributes
    FACULTY -> FAC_department;
    FACULTY -> FAC_designation;

    // HOD attributes
    HOD -> HOD_department;

    // TICKET attributes
    TICKET -> TKT_id;
    TICKET -> TKT_ticketId;
    TICKET -> TKT_title;
    TICKET -> TKT_description;
    TICKET -> TKT_category;
    TICKET -> TKT_status;
    TICKET -> TKT_isUrgent;
    TICKET -> TKT_imageUrl;
    TICKET -> TKT_remarks;
    TICKET -> TKT_createdAt;

    // FEEDBACK attributes
    FEEDBACK -> FB_id;
    FEEDBACK -> FB_title;
    FEEDBACK -> FB_description;
    FEEDBACK -> FB_type;
    FEEDBACK -> FB_department;
    FEEDBACK -> FB_batchYear;
    FEEDBACK -> FB_csSection;
    FEEDBACK -> FB_isActive;
    FEEDBACK -> FB_expiresAt;

    // QUESTION attributes
    QUESTION -> Q_questionId;
    QUESTION -> Q_questionText;
    QUESTION -> Q_questionType;
    QUESTION -> Q_options;
    QUESTION -> Q_isRequired;

    // SUBMISSION attributes
    SUBMISSION -> SUB_id;
    SUBMISSION -> SUB_submittedAt;
    SUBMISSION -> SUB_sentiment;
    SUB_sentiment -> SUB_sent_label;
    SUB_sentiment -> SUB_sent_score;

    // RESPONSE attributes
    RESPONSE -> RESP_questionId;
    RESPONSE -> RESP_answer;

    // NOTIFICATION attributes
    NOTIFICATION -> NOT_id;
    NOTIFICATION -> NOT_title;
    NOTIFICATION -> NOT_message;
    NOTIFICATION -> NOT_type;
    NOTIFICATION -> NOT_isRead;
    NOTIFICATION -> NOT_createdAt;

    // ==========================================
    // CONNECT ENTITIES TO RELATIONSHIPS
    // ==========================================

    // STUDENT ---(1)--- CREATES ---(N)--- TICKET
    edge [style=solid, color="#333333", penwidth=2];
    STUDENT -> REL_CREATES [label="1", headlabel=""];
    REL_CREATES -> TICKET [label="N", taillabel=""];

    // TICKET ---(N)--- ASSIGNED_TO ---(1)--- HOD
    TICKET -> REL_ASSIGNED [label="N"];
    REL_ASSIGNED -> HOD [label="1"];

    // FACULTY ---(1)--- CREATES_FORM ---(N)--- FEEDBACK
    FACULTY -> REL_CREATES_FORM [label="1"];
    REL_CREATES_FORM -> FEEDBACK [label="N"];

    // FEEDBACK ===(1)=== HAS ===(N)=== QUESTION (Identifying)
    edge [style=bold, color="#d84315", penwidth=3];
    FEEDBACK -> REL_HAS [label="1"];
    REL_HAS -> QUESTION [label="N"];

    // STUDENT ---(1)--- SUBMITS ---(N)--- SUBMISSION
    edge [style=solid, color="#333333", penwidth=2];
    STUDENT -> REL_SUBMITS [label="1"];
    REL_SUBMITS -> SUBMISSION [label="N"];

    // SUBMISSION ---(N)--- FOR ---(1)--- FEEDBACK
    SUBMISSION -> REL_FOR [label="N"];
    REL_FOR -> FEEDBACK [label="1"];

    // SUBMISSION ===(1)=== CONTAINS ===(N)=== RESPONSE (Identifying)
    edge [style=bold, color="#d84315", penwidth=3];
    SUBMISSION -> REL_CONTAINS [label="1"];
    REL_CONTAINS -> RESPONSE [label="N"];

    // RESPONSE ---(N)--- ANSWERS ---(1)--- QUESTION
    edge [style=solid, color="#333333", penwidth=2];
    RESPONSE -> REL_ANSWERS [label="N"];
    REL_ANSWERS -> QUESTION [label="1"];

    // USER ---(1)--- RECEIVES ---(N)--- NOTIFICATION
    USER -> REL_RECEIVES [label="1"];
    REL_RECEIVES -> NOTIFICATION [label="N"];

    // ==========================================
    // SPECIALIZATION/GENERALIZATION (ISA)
    // ==========================================

    edge [style=solid, color="#37474f", penwidth=2];
    USER -> ISA [label="d,t", fontsize=8];
    ISA -> STUDENT;
    ISA -> FACULTY;
    ISA -> HOD;
    ISA -> PRINCIPAL;

    // ==========================================
    // LAYOUT HINTS
    // ==========================================

    // Group entities by rank for better layout
    { rank=same; USER; }
    { rank=same; STUDENT; FACULTY; HOD; PRINCIPAL; }
    { rank=same; TICKET; FEEDBACK; NOTIFICATION; }
    { rank=same; QUESTION; SUBMISSION; }
    { rank=same; RESPONSE; }
}
`;

    return dot;
}

// Generate Mermaid ER (for reference - Mermaid doesn't support Chen's notation natively)
function generateMermaidER() {
    return `# ER Diagram - Chen's Notation Reference

> **Note:** Mermaid doesn't support true Chen's notation. Use the Graphviz DOT file for proper Chen's notation.
> This Mermaid diagram shows the same relationships in Crow's Foot notation for quick reference.

## Crow's Foot Notation (Mermaid)

\`\`\`mermaid
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
\`\`\`

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

The \`er-diagram-chen.dot\` file contains the full Chen's notation diagram.

\`\`\`bash
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
\`\`\`

---
Generated on: ${new Date().toISOString()}
`;
}

// Main execution
function main() {
    console.log("🔍 Analyzing database schema from models...");
    console.log("📊 Generating ER Diagram in Chen's Notation...\n");

    // Generate DOT file
    const dotContent = generateChenDOT();
    const dotPath = path.resolve(process.cwd(), `${outputFile}.dot`);
    fs.writeFileSync(dotPath, dotContent);
    console.log(`✅ Graphviz DOT file: ${dotPath}`);

    // Generate Mermaid reference file
    const mdContent = generateMermaidER();
    const mdPath = path.resolve(process.cwd(), `${outputFile}.md`);
    fs.writeFileSync(mdPath, mdContent);
    console.log(`✅ Mermaid reference: ${mdPath}`);

    console.log(`
📖 To render the Chen's Notation ER diagram:

   1. Install Graphviz:
      - Ubuntu/Debian: sudo apt install graphviz
      - macOS: brew install graphviz
      - Windows: choco install graphviz

   2. Generate image:
      dot -Tpng ${outputFile}.dot -o ${outputFile}.png
      dot -Tsvg ${outputFile}.dot -o ${outputFile}.svg

   3. Or use online renderer:
      https://dreampuf.github.io/GraphvizOnline/

--- Schema Summary ---
Entities: ${schema.entities.length}
Relationships: ${schema.relationships.length}
Total Attributes: ${schema.entities.reduce((sum, e) => sum + e.attributes.length, 0)}
`);
}

main();
