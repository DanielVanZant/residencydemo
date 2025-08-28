const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// North star values for each user showing progression over time
const northStarData = {
    'ada-lovelace': {
        metric: 'Algorithms Documented',
        values: [
            { date: '2025-08-04', value: 2.0, note: 'Completed Bernoulli numbers and basic loop structure algorithms' },
            { date: '2025-08-11', value: 3.0, note: 'Added Fibonacci sequence generator to the collection' },
            { date: '2025-08-13', value: 3.5, note: 'Refined Fibonacci with optimization notes, halfway through prime generator' },
            { date: '2025-08-18', value: 5.0, note: 'Breakthrough week - completed prime generator and factorial calculator' },
            { date: '2025-08-20', value: 6.0, note: 'Documented complete recursive loop structures' },
            { date: '2025-08-25', value: 7.0, note: 'Added sorting algorithm with full mathematical proof' },
            { date: '2025-09-01', value: 9.0, note: 'Major milestone - documented complete instruction set for Analytical Engine' }
        ]
    },
    'leonardo-davinci': {
        metric: 'Inventions Prototyped',
        values: [
            { date: '2025-07-28', value: 1.0, note: 'Completed first working model of the aerial screw' },
            { date: '2025-08-04', value: 2.0, note: 'Finished prototype of the mechanical knight' },
            { date: '2025-08-11', value: 2.5, note: 'Parachute design tested, needs refinement' },
            { date: '2025-08-18', value: 4.0, note: 'Two prototypes this week: improved flying machine and hydraulic pump' },
            { date: '2025-08-25', value: 5.0, note: 'Completed working model of the armored vehicle' },
            { date: '2025-08-27', value: 6.0, note: 'Finalized the revolving bridge mechanism' }
        ]
    },
    'marie-curie': {
        metric: 'Radium Yield (mg)',
        values: [
            { date: '2025-07-28', value: 0.001, note: 'First successful isolation, trace amounts detected' },
            { date: '2025-08-04', value: 0.005, note: 'Improved extraction process yielding better results' },
            { date: '2025-08-11', value: 0.012, note: 'New crystallization technique showing promise' },
            { date: '2025-08-18', value: 0.023, note: 'Breakthrough in purification process, yield nearly doubled' },
            { date: '2025-08-25', value: 0.041, note: 'Scaled up operation with new equipment, best week yet' }
        ]
    },
    'steve-wozniak': {
        metric: 'Circuit Boards Completed',
        values: [
            { date: '2025-07-28', value: 1.0, note: 'First working prototype of the blue box circuit' },
            { date: '2025-08-04', value: 2.0, note: 'Completed improved version with better frequency control' },
            { date: '2025-08-11', value: 3.0, note: 'Finished the disk drive controller board' },
            { date: '2025-08-18', value: 5.0, note: 'Two boards completed: memory expansion and video display' },
            { date: '2025-08-25', value: 7.0, note: 'Productive week - keyboard interface and color graphics boards done' }
        ]
    }
};

// Connect to database
const dbPath = path.join(__dirname, 'weekly_updates.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Function to update north star values
async function updateNorthStarValues() {
    console.log('Starting north star value updates...\n');
    
    for (const [username, data] of Object.entries(northStarData)) {
        console.log(`Processing ${username} (${data.metric}):`);
        
        // Get user ID
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!user) {
            console.log(`  User ${username} not found, skipping...`);
            continue;
        }
        
        // Update each weekly update
        for (const entry of data.values) {
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE weekly_updates 
                     SET north_star_value = ?, north_star_note = ?
                     WHERE user_id = ? AND week_date = ?`,
                    [entry.value, entry.note, user.id, entry.date],
                    function(err) {
                        if (err) {
                            console.error(`  Error updating ${entry.date}:`, err.message);
                            reject(err);
                        } else if (this.changes > 0) {
                            console.log(`  ✓ ${entry.date}: ${entry.value} - "${entry.note}"`);
                            resolve();
                        } else {
                            console.log(`  ⚠ ${entry.date}: No update found for this date`);
                            resolve();
                        }
                    }
                );
            });
        }
        console.log('');
    }
}

// Run the update
updateNorthStarValues()
    .then(() => {
        console.log('All north star values updated successfully!');
        
        // Verify the updates
        console.log('\nVerifying updates:');
        db.all(`
            SELECT u.username, wu.week_date, wu.north_star_value, wu.north_star_note
            FROM weekly_updates wu
            JOIN users u ON wu.user_id = u.id
            WHERE wu.north_star_value IS NOT NULL
            ORDER BY u.username, wu.week_date
        `, (err, rows) => {
            if (err) {
                console.error('Error verifying:', err);
            } else {
                console.log(`Found ${rows.length} updates with north star values`);
                rows.forEach(row => {
                    console.log(`  ${row.username} (${row.week_date}): ${row.north_star_value}`);
                });
            }
            db.close();
        });
    })
    .catch(err => {
        console.error('Error during update:', err);
        db.close();
        process.exit(1);
    });