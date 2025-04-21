// controllers/getUserStats.js
const Session = require("../models/Session");

const getUserStats = async (req, res) => {
    const { userId } = req.params; // Get userId from URL params

    try {
        // Aggregate the total tokens and cost for a specific user
        const result = await Session.aggregate([
            { $match: { userId } },  // Match by userId
            {
                $group: {
                    _id: "$userId",
                    totalInputTokens: { $sum: "$inputTokens" },
                    totalOutputTokens: { $sum: "$outputTokens" },
                    totalTokens: { $sum: "$totalTokens" },
                    totalCost: { $sum: { $toDouble: { $substr: ["$costUSD", 1, -1] } } }  // Parse cost
                }
            }
        ]);

        if (result.length === 0) {
            return res.json({ message: `No sessions found for user ${userId}`, totalTokens: 0, totalCost: 0 });
        }

        const { totalTokens, totalCost } = result[0];

        // Return the total tokens and cost for the user
        res.json({
            userId,
            totalTokens,
            totalCost: `$${totalCost.toFixed(4)}`
        });
    } catch (err) {
        console.error("Error fetching user stats:", err);
        res.status(500).json({ error: "Unexpected Error!" });
    }
};

module.exports = getUserStats;
