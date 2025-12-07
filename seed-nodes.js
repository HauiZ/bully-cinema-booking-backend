require('dotenv').config();
const { sequelize } = require('./models');
const Node = require('./modules/node/node.model');

const seedNodes = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        await sequelize.sync();

        const count = await Node.count();
        if (count > 0) {
            console.log('⚠️ Nodes table already has data.');
        } else {
            const nodesData = [
                { id: 1, is_alive: true, is_leader: false },
                { id: 2, is_alive: true, is_leader: false },
                { id: 3, is_alive: true, is_leader: false },
                { id: 4, is_alive: true, is_leader: false },
                { id: 5, is_alive: true, is_leader: false },
                { id: 6, is_alive: true, is_leader: false },
            ];
            await Node.bulkCreate(nodesData);
            console.log(`🎉 Successfully seeded ${nodesData.length} nodes!`);
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding nodes failed:', error);
        process.exit(1);
    }
};

seedNodes();