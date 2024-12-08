const express = require('express');
const r = require('rethinkdb');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));
let connection;

r.connect({ host: 'localhost', port: 28015 }, (err, conn) => {
    if (err) throw err;
    connection = conn;

    r.dbList().contains('surveys')
        .do(dbExists => r.branch(dbExists, { dbs_created: 0 }, r.dbCreate('surveys')))
        .run(connection);
});
app.post('/surveys', (req, res) => {
    const survey = req.body;
    r.db('surveys').table('surveys').insert(survey).run(connection, (err, result) => {
        if (err) res.status(500).send(err);
        else res.status(201).send({ id: result.generated_keys[0], ...survey });
    });
});
app.get('/surveys', (req, res) => {
    r.db('surveys').table('surveys').run(connection, (err, cursor) => {
        if (err) res.status(500).send(err);
        else cursor.toArray((err, result) => res.status(200).send(result));
    });
});
app.post('/surveys/:id/vote/:index', (req, res) => {
    const { id, index } = req.params;
    r.db('surveys').table('surveys').get(id)
        .update({ options: r.row('options').changeAt(index, r.row('options')(index).merge({ votes: r.row('options')(index)('votes').add(1) })) })
        .run(connection, (err, result) => {
            if (err) res.status(500).send(err);
            else res.status(200).send(updatedSurvey);        });
});
app.listen(3000, () => console.log('Server running on http://localhost:3000'));