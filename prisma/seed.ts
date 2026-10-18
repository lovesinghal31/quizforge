import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('🌱 Starting QuizForge database seed...');

  // 1. Create or upsert a stable instructor / demo user
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@quizforge.com' },
    update: {
      name: 'Prof. Alex Mercer',
    },
    create: {
      email: 'instructor@quizforge.com',
      name: 'Prof. Alex Mercer',
      emailVerified: true,
      image: null,
    },
  });

  console.log(`👤 Seed creator user verified: ${instructor.email} (${instructor.id})`);

  // 2. Define the sample quizzes with accurate questions and options
  const quizzesData = [
    {
      title: 'TypeScript Essentials & Advanced Generics',
      description:
        'Test your understanding of TypeScript type inference, mapped types, conditional types, and utility generics.',
      category: 'Programming',
      difficulty: 'MEDIUM' as const,
      timeLimitSeconds: 600,
      isPublished: true,
      questions: [
        {
          text: 'What is the purpose of the `infer` keyword in conditional types?',
          explanation:
            'The `infer` keyword allows introducing a type variable within the `extends` clause of a conditional type to extract sub-types.',
          options: [
            { text: 'To declare a type variable to be deduced within a conditional type branch', isCorrect: true },
            { text: 'To cast a variable to any without type checking', isCorrect: false },
            { text: 'To force TypeScript to infer a variable as a runtime symbol', isCorrect: false },
            { text: 'To suppress compiler strict null check errors', isCorrect: false },
          ],
        },
        {
          text: 'Which TypeScript utility type constructs a type with all properties of T set to optional?',
          explanation: 'Partial<T> sets all properties of T to optional using mapped types.',
          options: [
            { text: 'Partial<T>', isCorrect: true },
            { text: 'Required<T>', isCorrect: false },
            { text: 'Readonly<T>', isCorrect: false },
            { text: 'Pick<T, K>', isCorrect: false },
          ],
        },
        {
          text: 'What does the `keyof` operator return when applied to an object type?',
          explanation: 'The `keyof` operator produces a string or numeric literal union of an object type’s property keys.',
          options: [
            { text: 'A union of the keys as string or numeric literals', isCorrect: true },
            { text: 'An array of strings containing all property names at runtime', isCorrect: false },
            { text: 'A union of all value types in the object', isCorrect: false },
            { text: 'The prototype chain of the object', isCorrect: false },
          ],
        },
        {
          text: 'What is the main difference between an `interface` and a `type` alias in TypeScript regarding declaration merging?',
          explanation: 'Interfaces support declaration merging across multiple declarations; type aliases do not.',
          options: [
            { text: 'Interfaces with the same name automatically merge declarations, while type aliases cannot', isCorrect: true },
            { text: 'Type aliases can declare objects, while interfaces can only declare primitives', isCorrect: false },
            { text: 'Interfaces cannot extend other interfaces', isCorrect: false },
            { text: 'Type aliases generate runtime objects, while interfaces do not', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Modern Python & AsyncIO Patterns',
      description:
        'Explore fundamental Python 3 constructs, coroutines, async event loops, generators, and context managers.',
      category: 'Programming',
      difficulty: 'EASY' as const,
      timeLimitSeconds: 480,
      isPublished: true,
      questions: [
        {
          text: 'Which keyword is used to pause the execution of an async function until a coroutine completes?',
          explanation: 'The `await` keyword suspends the execution of the enclosing coroutine until the awaitable is resolved.',
          options: [
            { text: 'await', isCorrect: true },
            { text: 'yield', isCorrect: false },
            { text: 'defer', isCorrect: false },
            { text: 'async', isCorrect: false },
          ],
        },
        {
          text: 'What protocol must an object implement to be used in a Python `with` statement?',
          explanation: 'Context managers implement `__enter__` and `__exit__`.',
          options: [
            { text: '__enter__ and __exit__', isCorrect: true },
            { text: '__iter__ and __next__', isCorrect: false },
            { text: '__get__ and __set__', isCorrect: false },
            { text: '__open__ and __close__', isCorrect: false },
          ],
        },
        {
          text: 'What is the time complexity of looking up a key in a Python dictionary on average?',
          explanation: 'Python dictionaries are implemented as hash tables with O(1) average lookup time.',
          options: [
            { text: 'O(1)', isCorrect: true },
            { text: 'O(log n)', isCorrect: false },
            { text: 'O(n)', isCorrect: false },
            { text: 'O(n log n)', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Rust Memory Safety & Borrow Checker',
      description:
        'Master Rust ownership, lifetimes, mutable references, and compile-time data race prevention.',
      category: 'Programming',
      difficulty: 'HARD' as const,
      timeLimitSeconds: 720,
      isPublished: true,
      questions: [
        {
          text: 'Which rule correctly describes Rust references according to the borrow checker?',
          explanation: 'At any given time, you can have either one mutable reference or any number of immutable references.',
          options: [
            { text: 'You can have either one mutable reference or any number of immutable references, but not both', isCorrect: true },
            { text: 'You can have multiple mutable references as long as they are in different threads', isCorrect: false },
            { text: 'Immutable references can be created from an active mutable reference', isCorrect: false },
            { text: 'Mutable references never require explicit lifetimes', isCorrect: false },
          ],
        },
        {
          text: 'What happens to a value with no `Copy` trait implementation when assigned to another variable?',
          explanation: 'In Rust, assignment of non-Copy types transfers ownership (moves the value).',
          options: [
            { text: 'Ownership is moved, and the original variable becomes invalid to use', isCorrect: true },
            { text: 'A deep copy is automatically allocated on the heap', isCorrect: false },
            { text: 'A garbage collector increments the reference count', isCorrect: false },
            { text: 'The compiler issues a runtime warning', isCorrect: false },
          ],
        },
        {
          text: 'What smart pointer in Rust provides shared ownership with interior mutability for single-threaded code?',
          explanation: '`Rc<RefCell<T>>` provides shared ownership (Rc) with dynamically checked interior mutability (RefCell).',
          options: [
            { text: 'Rc<RefCell<T>>', isCorrect: true },
            { text: 'Arc<Mutex<T>>', isCorrect: false },
            { text: 'Box<T>', isCorrect: false },
            { text: 'Weak<T>', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Next.js 16 App Router & Server Components',
      description:
        'Deep dive into React 19 Server Components, Turbopack, Cache Components, streaming, and route segment configs.',
      category: 'Web Development',
      difficulty: 'MEDIUM' as const,
      timeLimitSeconds: 600,
      isPublished: true,
      questions: [
        {
          text: 'By default, what type of component is created in the Next.js App Router without the `use client` directive?',
          explanation: 'In the App Router, components in the app directory are React Server Components (RSC) by default.',
          options: [
            { text: 'React Server Component (RSC)', isCorrect: true },
            { text: 'Client Component', isCorrect: false },
            { text: 'Hybrid Static View', isCorrect: false },
            { text: 'Web Worker Component', isCorrect: false },
          ],
        },
        {
          text: 'How do React Server Components improve initial page performance and bundle size?',
          explanation: 'RSC dependencies stay on the server and are not included in the client JavaScript bundle.',
          options: [
            { text: 'Their code dependencies are kept on the server and zero client JavaScript is shipped for them', isCorrect: true },
            { text: 'They compile React into WebAssembly binaries', isCorrect: false },
            { text: 'They automatically convert all CSS into inline SVG icons', isCorrect: false },
            { text: 'They disable client-side hydration for all interactive inputs', isCorrect: false },
          ],
        },
        {
          text: 'Which special Next.js file convention is used to wrap a route segment in a React Suspense boundary?',
          explanation: 'The `loading.tsx` file automatically creates a Suspense boundary around the segment page.',
          options: [
            { text: 'loading.tsx', isCorrect: true },
            { text: 'suspense.tsx', isCorrect: false },
            { text: 'fallback.tsx', isCorrect: false },
            { text: 'spinner.tsx', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Modern CSS Layouts, Grid & Container Queries',
      description:
        'Assess your proficiency with CSS Grid lines, Flexbox alignment, CSS variables, and native container queries.',
      category: 'Web Development',
      difficulty: 'EASY' as const,
      timeLimitSeconds: 450,
      isPublished: true,
      questions: [
        {
          text: 'What CSS rule declares an element as a query container for container size queries?',
          explanation: '`container-type: inline-size` establishes the element as a query container on its inline axis.',
          options: [
            { text: 'container-type: inline-size', isCorrect: true },
            { text: 'query-mode: container', isCorrect: false },
            { text: 'display: container-grid', isCorrect: false },
            { text: 'media-target: self', isCorrect: false },
          ],
        },
        {
          text: 'Which CSS Grid property specifies automatic column wrapping without hardcoded column counts?',
          explanation: '`grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))` creates responsive columns.',
          options: [
            { text: 'repeat(auto-fit, minmax(250px, 1fr))', isCorrect: true },
            { text: 'flex-wrap: auto-grid', isCorrect: false },
            { text: 'grid-columns: responsive', isCorrect: false },
            { text: 'repeat(12, 1fr)', isCorrect: false },
          ],
        },
        {
          text: 'In Flexbox, which property aligns items along the cross-axis?',
          explanation: '`align-items` aligns flex items along the cross-axis, while `justify-content` aligns along the main axis.',
          options: [
            { text: 'align-items', isCorrect: true },
            { text: 'justify-content', isCorrect: false },
            { text: 'flex-direction', isCorrect: false },
            { text: 'place-self', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'PostgreSQL Relational Design & Normalization',
      description:
        'Understand entity relationships, Boyce-Codd Normal Form, foreign key constraints, and cascade behaviors.',
      category: 'Database Management',
      difficulty: 'MEDIUM' as const,
      timeLimitSeconds: 600,
      isPublished: true,
      questions: [
        {
          text: 'What condition distinguishes Third Normal Form (3NF) from Second Normal Form (2NF)?',
          explanation: '3NF requires that the table is in 2NF and contains no transitive dependencies among non-prime attributes.',
          options: [
            { text: 'Every non-key attribute must be non-transitively dependent on every candidate key', isCorrect: true },
            { text: 'All columns must contain atomic primitive values', isCorrect: false },
            { text: 'Every table must have a composite primary key', isCorrect: false },
            { text: 'All multi-valued dependencies must be eliminated', isCorrect: false },
          ],
        },
        {
          text: 'What does the `ON DELETE CASCADE` constraint action specify?',
          explanation: 'It automatically deletes dependent child rows when the referenced parent row is deleted.',
          options: [
            { text: 'Child rows are automatically deleted when the referenced parent row is deleted', isCorrect: true },
            { text: 'The parent row deletion is aborted if child rows exist', isCorrect: false },
            { text: 'The foreign key in the child row is set to NULL', isCorrect: false },
            { text: 'An audit row is written to a separate table', isCorrect: false },
          ],
        },
        {
          text: 'What is the ACID guarantee that ensures transactions either complete entirely or are fully rolled back?',
          explanation: 'Atomicity ensures that all operations in a transaction succeed or all fail together.',
          options: [
            { text: 'Atomicity', isCorrect: true },
            { text: 'Consistency', isCorrect: false },
            { text: 'Isolation', isCorrect: false },
            { text: 'Durability', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Database Indexing & B-Trees Optimization',
      description:
        'Advanced index structures in PostgreSQL: B-Trees, GiST, GIN, composite indexing, and query plan analysis.',
      category: 'Database Management',
      difficulty: 'HARD' as const,
      timeLimitSeconds: 720,
      isPublished: true,
      questions: [
        {
          text: 'When using a composite B-Tree index on (A, B), which query WHERE clause can use the index efficiently?',
          explanation: 'B-Tree indexes can be scanned starting from the leftmost column; queries filtering on A or (A and B) can use the index.',
          options: [
            { text: 'WHERE A = 5 AND B > 10', isCorrect: true },
            { text: 'WHERE B = 10 only (without A)', isCorrect: false },
            { text: 'WHERE LOWER(A) = "val"', isCorrect: false },
            { text: 'WHERE B LIKE "%test%"', isCorrect: false },
          ],
        },
        {
          text: 'Which PostgreSQL index type is most suitable for full-text search and array containment (@>) queries?',
          explanation: 'GIN (Generalized Inverted Index) indexes are designed for composite values such as arrays, jsonb, and tsvector.',
          options: [
            { text: 'GIN (Generalized Inverted Index)', isCorrect: true },
            { text: 'Hash Index', isCorrect: false },
            { text: 'BRIN (Block Range Index)', isCorrect: false },
            { text: 'Standard B-Tree', isCorrect: false },
          ],
        },
        {
          text: 'What does an "Index Only Scan" in an EXPLAIN query execution plan signify?',
          explanation: 'All required columns were retrieved directly from the index tuple without accessing the heap table pages.',
          options: [
            { text: 'The engine retrieved all needed columns from the index without reading table heap pages', isCorrect: true },
            { text: 'The query executed a sequential scan because no index was available', isCorrect: false },
            { text: 'An index was built in-memory during query execution', isCorrect: false },
            { text: 'A bitmap heap scan failed and reverted to disk', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'TCP/IP Handshake & Transport Layer Protocols',
      description:
        'Analyze 3-way handshakes, SYN/ACK packet flags, sliding windows, flow control, and UDP vs TCP trade-offs.',
      category: 'Computer Networks',
      difficulty: 'MEDIUM' as const,
      timeLimitSeconds: 600,
      isPublished: true,
      questions: [
        {
          text: 'What is the correct packet exchange sequence for establishing a standard TCP connection?',
          explanation: 'The TCP three-way handshake proceeds: SYN -> SYN-ACK -> ACK.',
          options: [
            { text: 'SYN -> SYN-ACK -> ACK', isCorrect: true },
            { text: 'ACK -> SYN -> ACK-SYN', isCorrect: false },
            { text: 'HELLO -> CHALLENGE -> CONNECT', isCorrect: false },
            { text: 'FIN -> ACK -> FIN-ACK', isCorrect: false },
          ],
        },
        {
          text: 'What mechanism in TCP prevents a fast sender from overwhelming a slow receiver?',
          explanation: 'TCP Flow Control uses the advertised Receive Window (rwnd) in headers to pace the sender.',
          options: [
            { text: 'Flow Control via Advertised Receive Window (rwnd)', isCorrect: true },
            { text: 'Congestion Avoidance via Slow Start threshold only', isCorrect: false },
            { text: 'Time-To-Live (TTL) decrements', isCorrect: false },
            { text: 'Checksum recalculation', isCorrect: false },
          ],
        },
        {
          text: 'Why does UDP have lower latency and protocol overhead compared to TCP?',
          explanation: 'UDP is connectionless, has an 8-byte header, and avoids handshakes, acknowledgments, and retransmissions.',
          options: [
            { text: 'It has an 8-byte header and eliminates handshakes, ACK packets, and retransmission delays', isCorrect: true },
            { text: 'It compresses payload data using gzip hardware acceleration', isCorrect: false },
            { text: 'It bypasses the IP routing layer entirely', isCorrect: false },
            { text: 'It operates at the physical layer of the OSI model', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'DNS, TLS 1.3 & Web Application Security',
      description:
        'Evaluate DNS record types, TLS 1.3 handshakes, forward secrecy, and modern cryptographic defenses.',
      category: 'Computer Networks',
      difficulty: 'HARD' as const,
      timeLimitSeconds: 600,
      isPublished: true,
      questions: [
        {
          text: 'How does TLS 1.3 achieve faster handshake times compared to TLS 1.2?',
          explanation: 'TLS 1.3 reduces the standard handshake from 2 round-trips (2-RTT) to 1 round-trip (1-RTT) and supports 0-RTT resumption.',
          options: [
            { text: 'It combines key exchange with the Hello message, completing the handshake in 1-RTT', isCorrect: true },
            { text: 'It removes asymmetric public-key cryptography completely', isCorrect: false },
            { text: 'It transmits passwords in plain text during the initial step', isCorrect: false },
            { text: 'It relies solely on client-side caching without server verification', isCorrect: false },
          ],
        },
        {
          text: 'Which DNS record type is used to map a hostname directly to an IPv4 address?',
          explanation: 'An "A" record maps an FQDN to an IPv4 address, while "AAAA" maps to an IPv6 address.',
          options: [
            { text: 'A record', isCorrect: true },
            { text: 'CNAME record', isCorrect: false },
            { text: 'MX record', isCorrect: false },
            { text: 'AAAA record', isCorrect: false },
          ],
        },
        {
          text: 'What security property ensures past encrypted communications cannot be decrypted even if the server private key is compromised in the future?',
          explanation: 'Perfect Forward Secrecy (PFS) generates ephemeral session keys that are discarded after use.',
          options: [
            { text: 'Forward Secrecy (Perfect Forward Secrecy)', isCorrect: true },
            { text: 'Certificate Transparency', isCorrect: false },
            { text: 'Public Key Pinning', isCorrect: false },
            { text: 'HMAC Authentication', isCorrect: false },
          ],
        },
      ],
    },
    {
      title: 'Data Structures & Asymptotic Algorithm Analysis',
      description:
        'Fundamental evaluation of Big-O complexity, binary search trees, hash collisions, and graph traversals.',
      category: 'General Computer Science',
      difficulty: 'EASY' as const,
      timeLimitSeconds: 600,
      isPublished: true,
      questions: [
        {
          text: 'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST)?',
          explanation: 'In the worst case (e.g. inserting elements in sorted order), a BST degenerates into a linked list with O(n) search time.',
          options: [
            { text: 'O(n)', isCorrect: true },
            { text: 'O(1)', isCorrect: false },
            { text: 'O(log n)', isCorrect: false },
            { text: 'O(n²)', isCorrect: false },
          ],
        },
        {
          text: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
          explanation: 'A Queue operates under the FIFO principle, while a Stack operates under LIFO.',
          options: [
            { text: 'Queue', isCorrect: true },
            { text: 'Stack', isCorrect: false },
            { text: 'Heap', isCorrect: false },
            { text: 'Trie', isCorrect: false },
          ],
        },
        {
          text: 'What algorithm is typically used to find the shortest path in an unweighted graph?',
          explanation: 'Breadth-First Search (BFS) explores all vertices at the current depth before moving deeper, yielding shortest paths on unweighted graphs.',
          options: [
            { text: 'Breadth-First Search (BFS)', isCorrect: true },
            { text: 'Depth-First Search (DFS)', isCorrect: false },
            { text: 'Kruskal Algorithm', isCorrect: false },
            { text: 'Topological Sort', isCorrect: false },
          ],
        },
      ],
    },
  ];

  // 3. Insert each quiz idempotently
  let createdCount = 0;
  for (const qData of quizzesData) {
    // Check if quiz already exists with this title by this creator
    const existing = await prisma.quiz.findFirst({
      where: {
        title: qData.title,
        creatorId: instructor.id,
      },
      include: {
        questions: true,
      },
    });

    if (existing) {
      console.log(`⏩ Quiz already exists: "${qData.title}" (skipping)`);
      continue;
    }

    // Create quiz with nested questions and options
    await prisma.quiz.create({
      data: {
        title: qData.title,
        description: qData.description,
        category: qData.category,
        difficulty: qData.difficulty,
        timeLimitSeconds: qData.timeLimitSeconds,
        isPublished: qData.isPublished,
        creatorId: instructor.id,
        questions: {
          create: qData.questions.map((q, qIndex) => ({
            text: q.text,
            explanation: q.explanation,
            position: qIndex + 1,
            options: {
              create: q.options.map((opt, optIndex) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                position: optIndex + 1,
              })),
            },
          })),
        },
      },
    });

    createdCount++;
    console.log(`✅ Created quiz: "${qData.title}" (${qData.category} - ${qData.difficulty})`);
  }

  console.log(`✨ Seed complete! Created ${createdCount} quizzes. Total available in database.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
