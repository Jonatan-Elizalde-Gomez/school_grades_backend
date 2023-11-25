// server.js

const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');

// Conectar a MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/school', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.json());

app.use(cors());

// Modelos
const Student = mongoose.model('Student', new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
}));

const Subject = mongoose.model('Subject', new mongoose.Schema({
  name: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
}));


const User = mongoose.model('User', new mongoose.Schema({
    email: String,
    password: String,
  }));

  
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
      res.send({ message: 'Login successful' });
    } else {
      res.status(401).send({ message: 'Login failed' });
    }
  });

  
// Rutas
// CRUD de Alumnos
app.post('/students', async (req, res) => {
  const student = new Student(req.body);
  await student.save();
  res.send(student);
});

app.get('/students', async (req, res) => {
  const students = await Student.find();
  res.send(students);
});

app.get('/students/:id', async (req, res) => {
  const student = await Student.findById(req.params.id);
  res.send(student);
});

app.put('/students/:id', async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body);
  res.send(student);
});

app.put('/grade/:id', async (req, res) => {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body); 
    res.send(grade);
  });
  

app.delete('/students/:id', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.send({ message: 'Student deleted' });
});

app.delete('/subjects/:id', async (req, res) => {
    await Subject.findByIdAndDelete(req.params.id);
    res.send({ message: 'Subject deleted' });
  });

// CRUD de Materias
app.post('/subjects', async (req, res) => {
  const subject = new Subject(req.body);
  await subject.save();
  res.send(subject);
});

app.get('/subjects', async (req, res) => {
  const subjects = await Subject.find().populate('students');
  res.send(subjects);
});

// Inscripción de alumnos a materias
app.post('/subjects/:subjectId/enroll', async (req, res) => {
  const { studentId } = req.body;
  const subject = await Subject.findById(req.params.subjectId);
  subject.students.push(studentId);
  await subject.save();
  res.send(subject);
});

app.put('/subject-enroll/:subjectId', async (req, res) => {
        try {
          const { name, students } = req.body;
          const subjectId = req.params.subjectId;
          
          // Buscar la asignatura por ID
          const subject = await Subject.findByIdAndUpdate(
            subjectId,
            {
              $set: {
                name: name,
                students: students
              }
            },
            { new: true }
          );
      
          if (!subject) {
            return res.status(404).json({ error: 'Asignatura no encontrada' });
          }
      
          res.send(subject);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Error interno del servidor' });
        }
      });
      
  



// Captura de Calificaciones (esto es un ejemplo simple que puedes expandir)
const Grade = mongoose.model('Grade', new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  grade: Number,
}));




app.get('/grades', async (req, res) => {
  const grades = await Grade.find().populate('student').populate('subject');
  res.send(grades);
});

app.get('/filter-grades', async (req, res) => {
    const studentId = req.query.studentId; // Obtienes el ID del estudiante de los parámetros de consulta
    if (!studentId) {
      return res.status(400).send({ message: 'studentId es requerido' });
    }
  
    try {
      const grades = await Grade.find({ 'student': studentId }) // Filtras las calificaciones por el ID del estudiante
                                .populate('student')
                                .populate('subject');
      res.send(grades);
    } catch (error) {
      res.status(500).send(error);
    }
  });
  
  app.delete('/grades/:id', async (req, res) => {
    await Grade.findByIdAndDelete(req.params.id);
    res.send({ message: 'Grade deleted' });
  });

app.get('/user/:userId/grades', async (req, res) => {
    try {
      const { userId } = req.params;
      // Asegúrate de que tu modelo Grade tenga una referencia al modelo User si necesitas filtrar por usuario
      // O bien, si el usuario ya está relacionado con los estudiantes, necesitarás hacer una consulta que refleje esa relación
      const grades = await Grade.find({ 'student._id': userId }).populate('student subject');
      res.send(grades);
    } catch (error) {
      res.status(500).send({ message: 'Error al obtener las calificaciones', error: error.message });
    }
  });


  app.post('/grades', async (req, res) => {
    const { student, subject, grade } = req.body;
  
    // Primero, verifica si ya existe una calificación para este estudiante y materia
    const existingGrade = await Grade.findOne({ student, subject });
    if (existingGrade) {
      return res.status(400).send({ message: 'La calificación ya existe para esta materia y estudiante.' });
    }
  
    // Si no existe, crea una nueva calificación
    const newGrade = new Grade({ student, subject, grade });
    await newGrade.save();
    res.send(newGrade);
  });

  app.get('/students/:studentId/subjects-without-grades', async (req, res) => {
  try {
    const { studentId } = req.params;
    // Obtener todas las materias a las que el estudiante está inscrito
    const studentSubjects = await Subject.find({ students: studentId });

    // Obtener todas las calificaciones del estudiante
    const studentGrades = await Grade.find({ student: studentId });

    // Filtrar las materias que no tienen calificación
    const subjectsWithoutGrades = studentSubjects.filter(subject => 
      !studentGrades.some(grade => grade.subject.toString() === subject._id.toString())
    );

    res.send(subjectsWithoutGrades);
  } catch (error) {
    res.status(500).send({ message: 'Error al obtener las materias sin calificación', error: error.message });
  }
});


// Configuración del servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
