const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// 1. Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT
    player_id AS playerId,
    player_name AS playerName
    FROM
    player_details
    `;
  const playerDetails = await db.all(getAllPlayersQuery);
  response.send(playerDetails);
});

// 2. Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerQuery = `
    SELECT
    player_id AS playerId,
    player_name AS playerName
    FROM
    player_details
    WHERE player_id = ${playerId};
    `;
  const getPlayer = await db.get(getSpecificPlayerQuery);
  response.send(getPlayer);
});

// 3. Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const updatePlayer = request.body;
  const { playerName } = updatePlayer;

  const updatePlayerQuery = `
    UPDATE
    player_details
    SET
    player_name = '${playerName}'
    WHERE player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// 4. Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT
    match_id AS matchId,
    match,
    year
    FROM
    match_details
    WHERE match_id = ${matchId}
    `;
  const matchDetails = await db.get(getMatchDetailsQuery);
  response.send(matchDetails);
});

// 5. Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchesOfAPlayerQuery = `
    SELECT 
    match_details.match_id AS matchId,
    match_details.match AS match,
    match_details.year AS year
    FROM
    match_details INNER JOIN player_match_score
    ON match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};
    `;
  const getAllMatchesOfAPlayer = await db.all(getAllMatchesOfAPlayerQuery);
  response.send(getAllMatchesOfAPlayer);
});

// 6. Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playersOfSpecificMatchQuery = `
  SELECT
  player_details.player_id AS playerId,
  player_details.player_name AS playerName
  FROM
  player_details INNER JOIN player_match_score
  ON player_details.player_id = player_match_score.player_id
  WHERE player_match_score.match_id = ${matchId}
  `;
  const playersOfSpecificMatch = await db.all(playersOfSpecificMatchQuery);
  response.send(playersOfSpecificMatch);
});

// 7. Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const boundariesAndTotalScoreOfSpecificPlayerQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(score) AS totalScore,
    sum(fours) AS totalFours,
    sum(sixes) AS totalSixes
    FROM
    player_details INNER JOIN player_match_score
    ON player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId}
    GROUP BY player_details.player_id;
    `;
  const boundariesAndTotalScoreOfSpecificPlayer = await db.get(
    boundariesAndTotalScoreOfSpecificPlayerQuery
  );
  response.send(boundariesAndTotalScoreOfSpecificPlayer);
});

module.exports = app;
