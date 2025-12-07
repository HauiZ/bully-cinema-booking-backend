require('dotenv').config();
const { sequelize } = require('./models');
const Seat = require('./modules/seat/seat.model');
const SeatStatus = require('./enums/seat-status.enum');

const seedSeats = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        await sequelize.sync(); // Ensure tables exist

        const count = await Seat.count();
        if (count > 0) {
            console.log('⚠️ Seats table already has data. Skipping seed.');
            process.exit(0);
        }

        const seats = [];
        const rows = ['A', 'B', 'C', 'D'];
        const cols = 8;

        for (const row of rows) {
            for (let i = 1; i <= cols; i++) {
                seats.push({
                    seat_number: `${row}${i}`,
                    status: SeatStatus.AVAILABLE,
                });
            }
        }

        await Seat.bulkCreate(seats);
        console.log(`🎉 Successfully seeded ${seats.length} seats!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedSeats();
