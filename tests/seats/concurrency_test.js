// tests/seats/concurrency_test.js
// Disclaimer: This is a disposable prototype to prove the concept.
// It assumes a PostgreSQL-like unique partial constraint.

const { Client } = require('pg');

async function runConcurrencyTest() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/malva'
  });

  try {
    await client.connect();

    // 1. Setup disposable schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS seat_holds (
        id SERIAL PRIMARY KEY,
        flight_instance_id INT,
        seat_id INT,
        status VARCHAR(20)
      );
      
      -- This is the critical constraint
      CREATE UNIQUE INDEX IF NOT EXISTS unique_active_hold 
      ON seat_holds (flight_instance_id, seat_id) 
      WHERE status = 'ACTIVE';
      
      TRUNCATE TABLE seat_holds;
    `);

    console.log('Schema ready. Simulating concurrent holds for Seat 1 on Flight 100.');

    // 2. Simulate N concurrent attempts to hold the same seat
    const N = 10;
    let successCount = 0;
    let failCount = 0;

    const attemptHold = async (workerId) => {
      const workerClient = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/malva'
      });
      await workerClient.connect();
      try {
        await workerClient.query(
          "INSERT INTO seat_holds (flight_instance_id, seat_id, status) VALUES ($1, $2, $3)",
          [100, 1, 'ACTIVE']
        );
        successCount++;
        console.log(`Worker ${workerId} SUCCESS: Held the seat.`);
      } catch (err) {
        if (err.code === '23505') { // unique_violation in Postgres
           failCount++;
           console.log(`Worker ${workerId} FAILED: Seat already held (Constraint violation).`);
        } else {
           console.error(`Worker ${workerId} ERROR:`, err);
        }
      } finally {
        await workerClient.end();
      }
    };

    // Run all at the exact same time
    const workers = Array.from({ length: N }, (_, i) => attemptHold(i));
    await Promise.all(workers);

    console.log('--- Results ---');
    console.log(`Successes (should be exactly 1): ${successCount}`);
    console.log(`Failures (should be exactly ${N - 1}): ${failCount}`);
    
    if (successCount === 1 && failCount === N - 1) {
       console.log('✅ CONCURRENCY TEST PASSED: No overbooking possible.');
    } else {
       console.error('❌ CONCURRENCY TEST FAILED: Overbooking occurred!');
    }

  } catch (err) {
    console.error('Test Setup Error:', err);
  } finally {
    await client.end();
  }
}

// To run this test, a local postgres instance is needed:
// run: node tests/seats/concurrency_test.js
if (require.main === module) {
  runConcurrencyTest();
}
