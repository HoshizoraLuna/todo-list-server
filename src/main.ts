import express from 'express'
import cors from 'cors'

import sqlite3 from 'sqlite3'

const port = process.env.PORT || 3333

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const engine = sqlite3.verbose()
const db = new engine.Database('db.sqlite', (err) => {
  if (err) {
    console.error(err.message)
    return
  }

  const sql = `CREATE TABLE IF NOT EXISTS todos (
    'id' INTEGER PRIMARY KEY,
    'order' INTEGER NOT NULL DEFAULT 0,
    'text' TEXT NOT NULL DEFAULT '',
    'done' INTEGER NOT NULL DEFAULT 0
  )`

  db.run(sql, (err) => {
    if (err) {
      console.error(err.message)
    }
  })
})

app.get('/api/todos', (req, res) => {
  const sql = "SELECT * FROM todos ORDER BY 'order'"

  db.all(sql, (err, rows) => {
    if (err) {
      console.error(err.message)
      res.status(500).send('Internal server error')
      return
    }

    for (const row of rows) {
      row.done = row.done === 1
    }

    res.json({ data: rows })
  })
})

app.get('/api/todos/:id', (req, res) => {
  const id = req.params.id

  const sql = `SELECT * FROM todos WHERE id = ${id}`

  db.get(sql, (err, row) => {
    if (err) {
      console.error(err.message)
      res.status(500).send('Internal server error')
      return
    }

    res.json({
      data: {
        id: row.id,
        order: row.order,
        text: row.text,
        done: row.done === 1
      }
    })
  })
})

app.post('/api/todos', (req, res) => {
  const { order, text, done } = req.body

  const sql = `INSERT INTO todos ('order', 'text', 'done') VALUES (${order}, '${text}', ${done})`

  db.run(sql, (err) => {
    if (err) {
      console.error(err.message)
      res.status(500).send('Internal server error')
      return
    }

    db.get('SELECT last_insert_rowid()', (err, row) => {
      if (err) {
        console.error(err.message)
        res.status(500).send('Internal server error')
        return
      }

      res.status(201).json({
        id: row['last_insert_rowid()'],
        order,
        text,
        done
      })
    })
  })
})

app.put('/api/todos/:id', (req, res) => {
  const id = req.params.id
  const { order, text, done } = req.body

  const sql = `UPDATE todos SET 'order' = ${order}, 'text' = '${text}', 'done' = ${done} WHERE id = ${id}`

  db.run(sql, (err) => {
    if (err) {
      console.error(err.message)
      res.status(500).send('Internal server error')
      return
    }

    res.status(200).send()
  })
})

app.patch('/api/todos/:id', (req, res) => {
  const id = req.params.id
  const body = req.body

  const sql = `UPDATE todos SET ${Object.keys(body)
    .map((key) => `'${key}' = '${body[key]}'`)
    .join(', ')} WHERE id = ${id}`

  db.run(sql, (err) => {
    if (err) {
      console.error(err.message)
      res.status(500).send('Internal server error')
      return
    }

    res.status(200).send()
  })
})

app.delete('/api/todos/:id', (req, res) => {
  const id = req.params.id

  const sql = `DELETE FROM todos WHERE id = ${id}`

  db.run(sql, (err) => {
    if (err) {
      console.error(err.message)
      res.status(500).send('Internal server error')
      return
    }

    res.status(200).send()
  })
})

app.use((req, res, next) => {
  res.status(404).send('Not found')
})

app.listen(port, () => {
  console.log(`Server started on port ${port}`)
})
