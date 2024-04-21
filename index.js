const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const port = 3000;

// Path to JDK's bin directory
const JDK_BIN_PATH = "C:\\Program Files\\Java\\jdk-21\\bin";

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/compile', (req, res) => {
    const code = req.body.code;
    const className = req.body.className;

    fs.writeFile(`${className}.java`, code, (err) => {
        if (err) {
            console.error(err);
            res.status(500).json({ success: false, error: 'Error saving code to file' });
            return;
        }

        exec(`${JDK_BIN_PATH}\\javac ${className}.java`, (err, stdout, stderr) => {
            if (err || stderr) {
                console.error('Compilation failed:', err || stderr);
                res.status(200).json({ success: false, error: err ? err.message : stderr }); // Send error message from exec
                return;
            }

            console.log('Compilation successful');
            res.status(200).json({ success: true });
        });
    });
});

app.post('/run', (req, res) => {
    const input = req.body.input.trim(); // Get input from request body
    const className = req.body.className;

    // Spawn a child process for running the Java program
    const javaProcess = exec(`${JDK_BIN_PATH}\\java ${className}`);

    let output = '';

    javaProcess.stdout.on('data', (data) => {
        output += data;
    });

    javaProcess.stderr.on('data', (data) => {
        console.error('Execution failed:', data);
        res.status(500).json({ output: data }); // Send error message as JSON
    });

    javaProcess.on('close', (code) => {
        console.log('Execution completed with code:', code);
        res.status(200).json({ output: output }); // Send output as JSON
    });

    // Write input to the stdin of the Java process
    javaProcess.stdin.write(input);
    javaProcess.stdin.end();
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
