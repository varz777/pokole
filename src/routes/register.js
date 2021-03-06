const polka = require('polka');
const bcrypt = require('bcrypt');
const strings = require('../strings');
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const { bcrypt: { salt }, register } = require('../data/config');

const router = polka();

router.get('/', (req, res) => res.status(200).json(String(Boolean(register))));

router.post('/', async (req, res) => {
    const email = req.headers['email'];
    const username = req.headers['username'];
    const password = req.headers['password'];

    if (!register) return res.status(403).json(strings.ERROR(strings.REGISTER_DISABLED))

    // If one of these three is not provided, end the requests
    if (!username) return res.status(403).json(strings.ERROR(strings.NO_USERNAME));
    if (!password) return res.status(403).json(strings.ERROR(strings.NO_PASSWORD));
    if (!email) return res.status(403).json(strings.ERROR(strings.NO_EMAIL));

    // Check if the e-mail is a valid one
    if (!emailRegex.test(email)) return res.status(403).end(strings.ERROR(strings.INVALID_EMAIL));

    // We check if the username or e-mail is already in use
    if (await req.db.table('users').filter({ username: username.toLowerCase() }).count().run()) return res.status(403).json(strings.ERROR(strings.TAKEN_USERNAME));
    if (await req.db.table('users').filter({ email: email.toLowerCase() }).count().run()) return res.status(403).json(strings.ERROR(strings.TAKEN_EMAIL));

    // We hash the password provided by the user
    const hash = await bcrypt.hash(password, salt);

    // We insert the user in the database
    const inserted = await req.db.table('users').insert({ username: username.toLowerCase(), email: email.toLowerCase(), password: hash }).run();
    if (inserted.inserted) return res.status(201).json(strings.SUCCESS(strings.SUCCESS_REGISTER));
    else return res.status(500).json(strings.ERROR(strings.SOMETHING_WENT_WRONG));
})

module.exports = router;