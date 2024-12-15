const express = require('express');
const r = require('rethinkdb');
const app = express();
app.use(express.json());
app.use(express.static('public'));
let connection;

r.connect({ host: 'localhost', port: 28015 }, (err, conn) => {
    if (err) throw err;
    connection = conn;

    r.dbList().contains('surveys')
        .do(dbExists => r.branch(dbExists, 
            { dbs_created: 0 }, r.dbCreate('surveys')))
        .run(connection);
        if (err) throw err;
    r.db('surveys').tableList().contains('surveys')
        .do(tableExists => r.branch(tableExists,
            { tables_created: 0 }, r.db('surveys')
            .tableCreate('surveys')))
        .run(connection, (err, result) => {
        if (err) throw err;
    });
});
app.post('/surveys', (req, res) => {
    const survey = req.body;
    r.db('surveys')
    .table('surveys')
    .insert(survey)
    .run(connection, (err, result) => {
        if (err) res.status(500).send(err);
        else res.status(201)
        .send({ id: result.generated_keys[0], ...survey });
    });
});
app.get('/surveys', (req, res) => {
    r.db('surveys')
    .table('surveys')
    .run(connection, (err, cursor) => {
        if (err) res.status(500).send(err);
        else cursor
        .toArray((err, result) => res.status(200)
        .send(result));
    });
});
app.post('/surveys/:id/vote/:index', (req, res) => {
    const { id, index } = req.params;
    console.log(`Survey ID: ${id}, Option Index: ${index}`);
    r.db('surveys')
        .table('surveys')
        .get(id)
        .update({
            options: r.row('options').changeAt(
                parseInt(index), 
                r.row('options')(parseInt(index))
                .merge({
                    votes: r.row('options')(parseInt(index))('votes').add(1)
                })
            )
        })
        .run(connection, (err, result) => {
            if (err) {
                res.status(500).send(err);
            } else {
                r.db('surveys')
                    .table('surveys')
                    .get(id)
                    .run(connection, (err, updatedSurvey) => {
                        if (err) res.status(500).send(err);
                        else res.status(200).send(updatedSurvey);
                    });
            }
        });
});
app.listen(3000, () => console.log('Server running on http://localhost:3000'));