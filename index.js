const express = require('express');
const app = express();
const db = require('./connection/db')
const upload = require('./middlewares/uploadFile')
const bcrypt = require('bcrypt')
const flash = require('express-flash')
const session = require('express-session')

//template engine = hbs
app.set('view engine', 'hbs');

//static folder (akses css)
app.use('/public', express.static('public'))
app.use('/uploads', express.static('uploads'))

app.use(flash())

app.use(
    session({
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 2
        },
        store: new session.MemoryStore(),
        saveUninitialized: true,
        resave: false,
        secret: 'secretValue'
    })
)

//body parser
app.use(express.urlencoded({extended:false}));

let month = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
]

const projects = [
    {
        projectTitle : "Aplikasi-DumbWays 2025",
        startDate : "2022-01-01",
        endDate : "2022-04-01",
        time_duration : "3",
        description: "example text to build on the card title and make up the bulk of the card's content",
       author : "Taufiq",
       posted_at: "2022-07-19",
       checkboxs_value: ['fa-brands fa-node-js fa-2x', 'fa-brands fa-react fa-2x', 'fa-brands fa-vuejs fa-2x', 'fa-brands fa-angular fa-2x'],
       image_project: "image.png"
    }
]

app.get('/register', function (request, response) {
    response.render('register')
})

app.post('/register', function (request, response) {
    let { name, email, password } = request.body

    password = bcrypt.hashSync(password, 10);

    let queryCheckEmail = `SELECT * FROM "users" WHERE email='${email}'`

    let query = `INSERT INTO users(name, email, password) VALUES
                    ('${name}', '${email}', '${password}')`

    db.connect((err, client, done) => {
        if (err) throw err

        client.query(queryCheckEmail, (err, result) => {
            if (err) throw err

            if (result.rowCount != 0) {
                return res.redirect('/register')
            }

            client.query(query, (err, result) => {
                done()
                if (err) throw err

                res.redirect('/login')
            })
        })
    })
})

app.get('/login', function (request, response) {
    response.render('login')
})

app.post('/login', function (request, response) {
    let { email, password } = request.body

    db.connect((err, client, done) => {
        if (err) throw err

        let queryCheckEmail = `SELECT * FROM "users" WHERE email='${email}'`

        client.query(queryCheckEmail, (err, result) => {
            if (err) throw err

            if (result.rowCount == 0) {
                request.flash('danger', 'email not found')

                return response.redirect('/login')
            }

            let isMatch = bcrypt.compareSync(password, result.rows[0].password)

            if (isMatch) {
                request.session.isLogin = true
                request.session.user = {
                    name: result.rows[0].name,
                }
                request.flash('success', 'login success')
                response.redirect('/')
            } else {
                request.flash('danger', 'email and password doesnt match')

                response.redirect('/login')
            }

        })
    })
})

app.get('/logout', function (request, response) {
    request.session.destroy()
    response.redirect('/')
})

app.get('/contact', function(request, response){
    response.render('contact')
})

app.get('/', function(request, response){

    let selectQuery = `SELECT *	FROM projects ORDER BY id DESC`

    db.connect((err,client,done)=>{
        if(err) throw err
       
            client.query(selectQuery, (err, result)=>{
            let dataProjects = result.rows
               
            let{projectTitle,startDate,endDate,description} = request.body;
            let date = new Date()
            let time_duration = timeDuration(new Date(startDate), new Date(endDate))
            

            dataProjects = dataProjects.map((project)=>{
                return{
                    ...project,
                    time_duration,
               
                    
                }
            })
            
            response.render('index',{
                isLogin: request.session.isLogin,
                user: request.session.user,
               project: dataProjects
            })
        })
    })
})

app.get('/form-project', function(request, response){

    let isLogin = request.session.isLogin
    if(!isLogin){
    return response.redirect('/')
    }
    response.render('form-blog',{
        isLogin
    });
    
})

app.post('/', upload.single('image_project'), function(request, response){

    
    let{projectTitle,startDate,endDate,description,checkboxs_value} = request.body;

    let cb_array = []
    if(typeof checkboxs_value === 'string'){
        cb_array.push(checkboxs_value)
    } else{
        cb_array = checkboxs_value;
    }
    // return console.log(typeof checkboxs_value);
    var s_date = new Date(startDate);
    var s_dateString = new Date(s_date.getTime() - (s_date.getTimezoneOffset() * 60000 ))
                    .toISOString()
                    .split("T")[0];
    var e_date = new Date(endDate);
    var e_dateString = new Date(e_date.getTime() - (e_date.getTimezoneOffset() * 60000 ))
                    .toISOString()
                    .split("T")[0];
    let time_duration = timeDuration(new Date(s_dateString), new Date(e_dateString));
    let image_project = request.file.filename

    let project = {
        projectTitle,
        startDate : s_dateString,
        endDate : e_dateString,
        time_duration,
        description,
        checkboxs_value,
        image_project
        // image: 'image.png'
    }
   
    db.connect((err, client, done)=>{
        if (err) throw err

        let queryPost = {
            text: `INSERT INTO projects (project_title,start_date,end_date, description,checkboxs_value, duration, image_card)
            VALUES($1,$2,$3,$4,$5,$6,$7)`,
            values: [
                projectTitle,
                startDate,
                endDate,
                description,
                cb_array,
                time_duration,
                image_project
           ],
        };
            

        client.query(queryPost, (err, result)=>{
            done()
            if(err) throw err
            response.redirect('/')
        })
    })
     
})

app.get('/:id', function(request, response){
    let id = request.params.id

    let queryDetail = `SELECT * FROM projects WHERE id=${id}`

    db.connect((err, client, done) =>{
        if(err) throw err

        client.query(queryDetail, (err, result) =>{
            done()
            // if(err) throw err

            // console.log(result.rows[0]);
            // response.render('blog-detail', {data: result.rows[0]} )
        })
    })    
})

app.get('/delete-project/:id', function(request, response){
    
    
    let id = request.params.id


    db.connect((err, client, done)=>{
        if(err) throw err
        let queryDelete = `DELETE FROM projects WHERE id=${id}`

        client.query(queryDelete, (err, result)=>{
            done()
            if(err) throw err

            response.redirect('/');
            
        })
    })
})

app.get('/edit-project/:id', function(request, response){
    let id = request.params.id
    db.connect((err, client, done)=>{
        if(err) throw err
        let queryDelete = `SELECT * FROM projects WHERE id=${id}`

        client.query(queryDelete, (err, result)=>{
            done()
            if(err) throw err
            // return console.log(result)
            response.render('edit-project', {data: result.rows[0]} )
                      
        })
    })    
})

app.post('/edit-project',upload.single('image_project'), function(request, response){
    
    let{projectTitle, startDate, endDate, description,checkboxs_value,id } = request.body;
    let cb_array = []
    if(typeof checkboxs_value === 'string'){
        cb_array.push(checkboxs_value)
    } else{
        cb_array = checkboxs_value;
    }
    let date = new Date()
    let time_duration = timeDuration(new Date(startDate), new Date(endDate)); 
    let image_project = request.file.filename
    
    db.connect((err, client, done)=>{
    if(err) throw err
    let queryUpdate = `UPDATE projects SET project_title='${projectTitle}', start_date='${startDate}', end_date='${endDate}',description='${description}', duration='${time_duration}', checkboxs_value='${cb_array}', image_card='${image_project}'  WHERE id=${id}`

    client.query(queryUpdate, (err, result)=>{
        // done()
        if(err) throw err

       response.redirect('/');
        })
    })
 })




function getFullTime(time) {
    let date = time.getDate()
    let monthIndex = time.getMonth()
    let year = time.getFullYear()

    let hour = time.getHours()
    let minute = time.getMinutes()

    return `${date} ${month[monthIndex]} ${year} ${hour}:${minute} WIB`
}

function timeDuration(s_dateString,e_dateString){
    let durationResult = e_dateString.getMonth() - s_dateString.getMonth() + (e_dateString.getFullYear() - s_dateString.getFullYear()) * 12;

    
    return Math.abs(durationResult);
}

function getDistanceTime(time) {
    // waktu posting = 08.30 => time
    // waktu aktual = 08.35 => new Date()
    // sudah berapa lama?
    // waktu aktual - waktu posting

    let distance = new Date() - new Date(time)

    let miliseconds = 1000
    let secondInMinutes = 60
    let minuteInHour = 60
    let secondInHour = secondInMinutes * minuteInHour // 3600
    let hourInDay = 23

    let dayDistance = distance / (miliseconds * secondInHour * hourInDay)

    if (dayDistance >= 1) {
        const dayDate = Math.floor(dayDistance) + ' day ago'
        return dayDate
    } else {
        let hourDistance = Math.floor(distance / (miliseconds * secondInHour))
        if (hourDistance > 0) {
            return hourDistance + ' hour ago'
        } else {
            let minuteDistance = Math.floor(distance / (miliseconds * secondInMinutes))
            return minuteDistance + ' minute ago'
        }
    }

}



                 
                

const port = 5500;
app.listen(port, function(){
    console.log(`server on port ${port} is running`);
})





//app.get('/about', function(request, response){
//    response.redirect('www.instagram.com');
//})





//routing method GET akses via url
// routing method POST akses via form