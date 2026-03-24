#!/usr/bin/env node
/**
 * Data Flow Diagram Generator for College Miniproject Backend
 *
 * Generates a Mermaid flowchart showing data flow through the system.
 *
 * Usage:
 *   node scripts/generate-dfd.js
 *   node scripts/generate-dfd.js --output dfd.md
 *   node scripts/generate-dfd.js --format dot  (for Graphviz)
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const outputFile = args.includes('--output')
    ? args[args.indexOf('--output') + 1]
    : 'dataflow-diagram.md';
const format = args.includes('--format')
    ? args[args.indexOf('--format') + 1]
    : 'mermaid';

// Project structure analysis
const systemArchitecture = {
    externalEntities: [
        { id: 'student', name: 'Student', icon: '👨‍🎓' },
        { id: 'faculty', name: 'Faculty', icon: '👨‍🏫' },
        { id: 'hod', name: 'HOD', icon: '👔' },
        { id: 'principal', name: 'Principal', icon: '🎓' },
        { id: 'google', name: 'Google OAuth', icon: '🔐' },
        { id: 'email', name: 'Email Service', icon: '📧' },
        { id: 'imagekit', name: 'ImageKit CDN', icon: '🖼️' }
    ],

    processes: [
        { id: 'P1', name: 'Authentication\nSystem', level: 1 },
        { id: 'P2', name: 'Ticket\nManagement', level: 1 },
        { id: 'P3', name: 'Feedback\nSystem', level: 1 },
        { id: 'P4', name: 'Notification\nService', level: 1 },
        { id: 'P5', name: 'NLP\nProcessing', level: 2 },
        { id: 'P6', name: 'Analytics\n& Reports', level: 1 }
    ],

    dataStores: [
        { id: 'D1', name: 'Users DB' },
        { id: 'D2', name: 'Tickets DB' },
        { id: 'D3', name: 'Feedback DB' },
        { id: 'D4', name: 'Notifications DB' }
    ],

    dataFlows: [
        // Authentication flows
        { from: 'student', to: 'P1', label: 'Login/Register Request' },
        { from: 'faculty', to: 'P1', label: 'Login Request' },
        { from: 'hod', to: 'P1', label: 'Login Request' },
        { from: 'principal', to: 'P1', label: 'Login Request' },
        { from: 'google', to: 'P1', label: 'OAuth Token' },
        { from: 'P1', to: 'D1', label: 'User Data' },
        { from: 'D1', to: 'P1', label: 'User Credentials' },
        { from: 'P1', to: 'email', label: 'OTP Email' },
        { from: 'P1', to: 'student', label: 'JWT Token' },

        // Ticket flows
        { from: 'student', to: 'P2', label: 'Create Ticket' },
        { from: 'P2', to: 'P5', label: 'Ticket Text' },
        { from: 'P5', to: 'P2', label: 'Category, Urgency' },
        { from: 'P2', to: 'D2', label: 'Store Ticket' },
        { from: 'P2', to: 'imagekit', label: 'Upload Image' },
        { from: 'imagekit', to: 'P2', label: 'Image URL' },
        { from: 'hod', to: 'P2', label: 'Update Status' },
        { from: 'D2', to: 'P2', label: 'Ticket Data' },
        { from: 'P2', to: 'P4', label: 'Status Change Event' },

        // Feedback flows
        { from: 'faculty', to: 'P3', label: 'Create Feedback Form' },
        { from: 'P3', to: 'D3', label: 'Store Feedback' },
        { from: 'student', to: 'P3', label: 'Submit Response' },
        { from: 'D3', to: 'P3', label: 'Feedback Data' },
        { from: 'P3', to: 'P5', label: 'Comment Text' },
        { from: 'P5', to: 'P3', label: 'Sentiment Score' },
        { from: 'hod', to: 'P3', label: 'View Feedback' },

        // Notification flows
        { from: 'P4', to: 'D4', label: 'Store Notification' },
        { from: 'D4', to: 'P4', label: 'Notification Data' },
        { from: 'P4', to: 'student', label: 'Push Notification' },
        { from: 'P4', to: 'faculty', label: 'Push Notification' },

        // Analytics flows
        { from: 'D2', to: 'P6', label: 'Ticket Stats' },
        { from: 'D3', to: 'P6', label: 'Feedback Stats' },
        { from: 'P6', to: 'principal', label: 'Dashboard Data' },
        { from: 'P6', to: 'hod', label: 'Department Stats' }
    ]
};

// Generate Mermaid diagram
function generateMermaidDFD() {
    let mermaid = `# Data Flow Diagram - College Feedback & Ticket System

## Level 0 - Context Diagram

\`\`\`mermaid
flowchart TB
    subgraph External["External Entities"]
        Student["👨‍🎓 Student"]
        Faculty["👨‍🏫 Faculty"]
        HOD["👔 HOD"]
        Principal["🎓 Principal"]
    end

    System(("🎯 College Feedback\\n& Ticket System"))

    Student -->|"Submit Tickets\\nSubmit Feedback"| System
    Faculty -->|"Create Feedback Forms\\nView Responses"| System
    HOD -->|"Manage Tickets\\nView Analytics"| System
    Principal -->|"View Reports\\nSystem Overview"| System

    System -->|"Notifications\\nStatus Updates"| Student
    System -->|"Analytics\\nFeedback Stats"| Faculty
    System -->|"Department Reports"| HOD
    System -->|"Institution Reports"| Principal
\`\`\`

## Level 1 - Detailed Data Flow Diagram

\`\`\`mermaid
flowchart TB
    %% Styling
    classDef external fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#fff3e0,stroke:#e65100,stroke-width:2px,rx:50,ry:50
    classDef datastore fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef nlp fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px

    %% External Entities
    Student["👨‍🎓 Student"]:::external
    Faculty["👨‍🏫 Faculty"]:::external
    HOD["👔 HOD"]:::external
    Principal["🎓 Principal"]:::external
    Google["🔐 Google OAuth"]:::external
    EmailSvc["📧 Email Service"]:::external
    ImageKit["🖼️ ImageKit CDN"]:::external

    %% Processes
    P1(("1.0\\nAuthentication\\nSystem")):::process
    P2(("2.0\\nTicket\\nManagement")):::process
    P3(("3.0\\nFeedback\\nSystem")):::process
    P4(("4.0\\nNotification\\nService")):::process
    P5(("5.0\\nNLP\\nProcessing")):::nlp
    P6(("6.0\\nAnalytics &\\nReports")):::process

    %% Data Stores
    D1[("D1: Users")]:::datastore
    D2[("D2: Tickets")]:::datastore
    D3[("D3: Feedback")]:::datastore
    D4[("D4: Notifications")]:::datastore

    %% Authentication Flows
    Student -->|"1. Register/Login"| P1
    Faculty -->|"2. Login"| P1
    HOD -->|"3. Login"| P1
    Principal -->|"4. Login"| P1
    Google -->|"5. OAuth Token"| P1
    P1 -->|"6. Send OTP"| EmailSvc
    P1 <-->|"7. User CRUD"| D1
    P1 -->|"8. JWT Token"| Student

    %% Ticket Flows
    Student -->|"9. Create Ticket"| P2
    P2 -->|"10. Analyze Text"| P5
    P5 -->|"11. Category + Urgency"| P2
    P2 -->|"12. Upload Image"| ImageKit
    ImageKit -->|"13. Image URL"| P2
    P2 <-->|"14. Ticket CRUD"| D2
    HOD -->|"15. Update Status"| P2
    P2 -->|"16. Status Event"| P4

    %% Feedback Flows
    Faculty -->|"17. Create Form"| P3
    P3 <-->|"18. Feedback CRUD"| D3
    Student -->|"19. Submit Response"| P3
    P3 -->|"20. Analyze Sentiment"| P5
    P5 -->|"21. Sentiment Score"| P3
    HOD -->|"22. View Feedback"| P3

    %% Notification Flows
    P4 <-->|"23. Store/Fetch"| D4
    P4 -->|"24. Notify"| Student
    P4 -->|"25. Notify"| Faculty

    %% Analytics Flows
    D2 -->|"26. Ticket Stats"| P6
    D3 -->|"27. Feedback Stats"| P6
    P6 -->|"28. Dashboard"| Principal
    P6 -->|"29. Dept Stats"| HOD
\`\`\`

## Level 2 - Authentication Process (P1) Decomposition

\`\`\`mermaid
flowchart TB
    classDef subprocess fill:#fff8e1,stroke:#ff8f00,stroke-width:2px
    classDef datastore fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    User["User"]

    subgraph P1["1.0 Authentication System"]
        P1_1(("1.1\\nValidate\\nCredentials")):::subprocess
        P1_2(("1.2\\nGenerate\\nOTP")):::subprocess
        P1_3(("1.3\\nVerify\\nOTP")):::subprocess
        P1_4(("1.4\\nGenerate\\nJWT")):::subprocess
        P1_5(("1.5\\nGoogle\\nOAuth")):::subprocess
        P1_6(("1.6\\nPassword\\nHashing")):::subprocess
    end

    D1[("D1: Users")]:::datastore
    Email["📧 Email"]
    Google["🔐 Google"]

    User -->|"Email/Password"| P1_1
    P1_1 -->|"Hash Password"| P1_6
    P1_6 -->|"Compare bcrypt"| D1
    P1_1 -->|"Request OTP"| P1_2
    P1_2 -->|"Send OTP"| Email
    User -->|"Enter OTP"| P1_3
    P1_3 -->|"Valid"| P1_4
    P1_4 -->|"JWT Token"| User
    Google -->|"Token"| P1_5
    P1_5 -->|"Create/Find User"| D1
    P1_5 -->|"Generate Token"| P1_4
\`\`\`

## Level 2 - Ticket Management (P2) Decomposition

\`\`\`mermaid
flowchart TB
    classDef subprocess fill:#fff8e1,stroke:#ff8f00,stroke-width:2px
    classDef datastore fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef nlp fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px

    Student["👨‍🎓 Student"]
    HOD["👔 HOD"]

    subgraph P2["2.0 Ticket Management"]
        P2_1(("2.1\\nCreate\\nTicket")):::subprocess
        P2_2(("2.2\\nAuto\\nCategorize")):::subprocess
        P2_3(("2.3\\nDetect\\nUrgency")):::subprocess
        P2_4(("2.4\\nProcess\\nImage")):::subprocess
        P2_5(("2.5\\nUpdate\\nStatus")):::subprocess
        P2_6(("2.6\\nFetch\\nTickets")):::subprocess
    end

    D2[("D2: Tickets")]:::datastore
    NLP(("5.0\\nNLP")):::nlp
    ImageKit["🖼️ ImageKit"]
    Notify(("4.0\\nNotifications"))

    Student -->|"Ticket Data"| P2_1
    P2_1 -->|"Description"| P2_2
    P2_1 -->|"Description"| P2_3
    P2_2 -->|"Get Category"| NLP
    P2_3 -->|"Get Urgency"| NLP
    NLP -->|"Category"| P2_2
    NLP -->|"Urgency Level"| P2_3
    P2_1 -->|"Image File"| P2_4
    P2_4 -->|"Upload"| ImageKit
    ImageKit -->|"URL"| P2_4
    P2_1 -->|"Store"| D2
    HOD -->|"Status Change"| P2_5
    P2_5 -->|"Update"| D2
    P2_5 -->|"Trigger"| Notify
    HOD -->|"Query"| P2_6
    P2_6 -->|"Fetch"| D2
\`\`\`

## Level 2 - Feedback System (P3) Decomposition

\`\`\`mermaid
flowchart TB
    classDef subprocess fill:#fff8e1,stroke:#ff8f00,stroke-width:2px
    classDef datastore fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef nlp fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px

    Faculty["👨‍🏫 Faculty"]
    Student["👨‍🎓 Student"]
    HOD["👔 HOD"]

    subgraph P3["3.0 Feedback System"]
        P3_1(("3.1\\nCreate\\nForm")):::subprocess
        P3_2(("3.2\\nTarget\\nStudents")):::subprocess
        P3_3(("3.3\\nSubmit\\nResponse")):::subprocess
        P3_4(("3.4\\nAnalyze\\nSentiment")):::subprocess
        P3_5(("3.5\\nCalculate\\nRatings")):::subprocess
        P3_6(("3.6\\nAggregate\\nResults")):::subprocess
    end

    D3[("D3: Feedback")]:::datastore
    NLP(("5.0\\nNLP")):::nlp

    Faculty -->|"Form Schema"| P3_1
    P3_1 -->|"Batch/Dept Filter"| P3_2
    P3_1 -->|"Store Form"| D3
    Student -->|"Answers"| P3_3
    P3_3 -->|"Comments"| P3_4
    P3_4 -->|"Text"| NLP
    NLP -->|"Sentiment"| P3_4
    P3_3 -->|"Ratings"| P3_5
    P3_5 -->|"Score Mapping"| P3_5
    P3_3 -->|"Store"| D3
    HOD -->|"Request Stats"| P3_6
    P3_6 -->|"Fetch"| D3
    P3_6 -->|"Aggregated Data"| HOD
\`\`\`

## Data Store Schema

\`\`\`mermaid
erDiagram
    USERS {
        ObjectId _id PK
        string email UK
        string password
        string role
        string name
        string department
        string batch
        string collegeId
    }

    TICKETS {
        ObjectId _id PK
        string ticketId UK
        ObjectId createdBy FK
        string title
        string description
        string category
        string status
        boolean isUrgent
        string imageUrl
        ObjectId assignedTo FK
    }

    FEEDBACK {
        ObjectId _id PK
        ObjectId createdBy FK
        string title
        string type
        array questions
        string department
        string batchYear
        boolean isActive
    }

    SUBMISSIONS {
        ObjectId _id PK
        ObjectId feedbackId FK
        ObjectId submittedBy FK
        array responses
        object sentiment
    }

    NOTIFICATIONS {
        ObjectId _id PK
        ObjectId userId FK
        string title
        string message
        boolean isRead
    }

    USERS ||--o{ TICKETS : creates
    USERS ||--o{ FEEDBACK : creates
    USERS ||--o{ SUBMISSIONS : submits
    USERS ||--o{ NOTIFICATIONS : receives
    FEEDBACK ||--o{ SUBMISSIONS : has
    TICKETS }o--|| USERS : assignedTo
\`\`\`

## API Endpoints Data Flow

\`\`\`mermaid
flowchart LR
    subgraph Client["Frontend Client"]
        UI["React App"]
    end

    subgraph API["Express.js API Gateway"]
        Auth["/api/auth"]
        Tickets["/api/tickets"]
        Student["/api/student"]
        Faculty["/api/faculty"]
        HOD["/api/hod"]
        Principal["/api/principal"]
        Notify["/api/notifications"]
    end

    subgraph Middleware["Middleware Layer"]
        JWT["JWT Verify"]
        RBAC["Role Check"]
        Multer["File Upload"]
    end

    subgraph Controllers["Business Logic"]
        AuthCtrl["auth.controller"]
        TicketCtrl["ticket.controller"]
        StudentCtrl["student.controller"]
        FacultyCtrl["faculty.controller"]
        HODCtrl["hod.controller"]
        PrincipalCtrl["principal.controller"]
    end

    subgraph Services["Services"]
        NLP["NLP Service"]
        Mailer["Email Service"]
        ImageKit["ImageKit"]
    end

    subgraph DB["MongoDB"]
        Users[(Users)]
        TicketsDB[(Tickets)]
        FeedbackDB[(Feedback)]
        NotifyDB[(Notifications)]
    end

    UI --> Auth & Tickets & Student & Faculty & HOD & Principal & Notify
    Auth --> JWT --> AuthCtrl
    Tickets --> JWT --> RBAC --> Multer --> TicketCtrl
    Student --> JWT --> RBAC --> StudentCtrl
    Faculty --> JWT --> RBAC --> FacultyCtrl
    HOD --> JWT --> RBAC --> HODCtrl
    Principal --> JWT --> RBAC --> PrincipalCtrl

    AuthCtrl --> Mailer
    AuthCtrl --> Users
    TicketCtrl --> NLP & ImageKit & TicketsDB
    StudentCtrl --> FeedbackDB
    FacultyCtrl --> FeedbackDB
    HODCtrl --> TicketsDB & FeedbackDB
    PrincipalCtrl --> Users & TicketsDB & FeedbackDB
\`\`\`

---

## How to View This Diagram

1. **VS Code**: Install "Markdown Preview Mermaid Support" extension
2. **GitHub**: Push this file to GitHub - it renders Mermaid automatically
3. **Online**: Copy the Mermaid code blocks to [mermaid.live](https://mermaid.live)
4. **Export**: Use mermaid-cli to export as PNG/SVG:
   \`\`\`bash
   npm install -g @mermaid-js/mermaid-cli
   mmdc -i dataflow-diagram.md -o dfd.png
   \`\`\`

---
Generated on: ${new Date().toISOString()}
`;

    return mermaid;
}

// Generate Graphviz DOT format
function generateGraphvizDFD() {
    return `digraph DFD {
    // Graph settings
    rankdir=TB;
    splines=ortho;
    node [fontname="Arial", fontsize=10];
    edge [fontname="Arial", fontsize=8];

    // External Entities (Rectangles)
    node [shape=box, style=filled, fillcolor="#e1f5fe"];
    Student [label="Student"];
    Faculty [label="Faculty"];
    HOD [label="HOD"];
    Principal [label="Principal"];
    Google [label="Google OAuth"];
    EmailSvc [label="Email Service"];
    ImageKit [label="ImageKit CDN"];

    // Processes (Circles)
    node [shape=circle, style=filled, fillcolor="#fff3e0", width=1.5];
    P1 [label="1.0\\nAuthentication"];
    P2 [label="2.0\\nTicket Mgmt"];
    P3 [label="3.0\\nFeedback"];
    P4 [label="4.0\\nNotifications"];
    P5 [label="5.0\\nNLP"];
    P6 [label="6.0\\nAnalytics"];

    // Data Stores (Open rectangles)
    node [shape=box, style="filled", fillcolor="#f3e5f5"];
    D1 [label="D1: Users"];
    D2 [label="D2: Tickets"];
    D3 [label="D3: Feedback"];
    D4 [label="D4: Notifications"];

    // Authentication flows
    Student -> P1 [label="Login"];
    Faculty -> P1 [label="Login"];
    HOD -> P1 [label="Login"];
    Principal -> P1 [label="Login"];
    Google -> P1 [label="OAuth"];
    P1 -> EmailSvc [label="Send OTP"];
    P1 -> D1 [label="Store User", dir=both];
    P1 -> Student [label="JWT Token"];

    // Ticket flows
    Student -> P2 [label="Create Ticket"];
    P2 -> P5 [label="Analyze"];
    P5 -> P2 [label="Category"];
    P2 -> ImageKit [label="Upload"];
    ImageKit -> P2 [label="URL"];
    P2 -> D2 [label="Store", dir=both];
    HOD -> P2 [label="Update Status"];
    P2 -> P4 [label="Event"];

    // Feedback flows
    Faculty -> P3 [label="Create Form"];
    P3 -> D3 [label="Store", dir=both];
    Student -> P3 [label="Submit"];
    P3 -> P5 [label="Sentiment"];
    P5 -> P3 [label="Score"];
    HOD -> P3 [label="View"];

    // Notification flows
    P4 -> D4 [label="Store", dir=both];
    P4 -> Student [label="Notify"];
    P4 -> Faculty [label="Notify"];

    // Analytics flows
    D2 -> P6 [label="Stats"];
    D3 -> P6 [label="Stats"];
    P6 -> Principal [label="Dashboard"];
    P6 -> HOD [label="Reports"];
}

/*
To render this DOT file:
1. Install Graphviz: sudo apt install graphviz
2. Run: dot -Tpng dataflow-diagram.dot -o dfd.png
   Or:  dot -Tsvg dataflow-diagram.dot -o dfd.svg
*/
`;
}

// Main execution
function main() {
    console.log('🔍 Analyzing project structure...');
    console.log('📊 Generating Data Flow Diagram...\n');

    let content;
    let extension;

    if (format === 'dot' || format === 'graphviz') {
        content = generateGraphvizDFD();
        extension = '.dot';
        console.log('Format: Graphviz DOT');
    } else {
        content = generateMermaidDFD();
        extension = '.md';
        console.log('Format: Mermaid Markdown');
    }

    const outputPath = outputFile.includes('.')
        ? outputFile
        : outputFile + extension;

    const fullPath = path.resolve(process.cwd(), outputPath);
    fs.writeFileSync(fullPath, content);

    console.log(`\n✅ Data Flow Diagram generated successfully!`);
    console.log(`📄 Output: ${fullPath}`);
    console.log(`\n📖 View instructions included at the bottom of the file.`);

    // Print summary
    console.log('\n--- DFD Summary ---');
    console.log(`External Entities: ${systemArchitecture.externalEntities.length}`);
    console.log(`Processes: ${systemArchitecture.processes.length}`);
    console.log(`Data Stores: ${systemArchitecture.dataStores.length}`);
    console.log(`Data Flows: ${systemArchitecture.dataFlows.length}`);
}

main();
