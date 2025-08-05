#!/usr/bin/env node

const { spawn } = require('child_process');

function runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

async function runRandomMultipleTimes(times = 5) {
    console.log(`npm run random을 ${times}번 실행합니다...`);
    
    for (let i = 1; i <= times; i++) {
        console.log(`\n=== 실행 ${i}/${times} ===`);
        try {
            await runCommand('npm', ['run', 'random']);
            console.log(`실행 ${i} 완료`);
        } catch (error) {
            console.error(`실행 ${i} 실패:`, error.message);
            process.exit(1);
        }
    }
    
    console.log(`\n모든 ${times}번의 실행이 완료되었습니다!`);
}

const times = process.argv[2] ? parseInt(process.argv[2]) : 5;
runRandomMultipleTimes(times);