// Chart Configuration
const ctx = document.getElementById('analyticsChart').getContext('2d');
const analyticsChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Task names will go here (e.g., Eng, Hindi, Maths, Sci, S.st)
        datasets: [{
            label: 'Time Spent (min)',
            data: [], // Time spent on each task will go here
            borderColor: '#917FB3',
            tension: 0.1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Time Spent (min)'
                },
                ticks: {
                    color: '#2A2F4F'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Task Name'
                },
                ticks: {
                    color: '#2A2F4F'
                }
            }
        }
    }
});
// Application State
let metrics = {
    completedTasks: 0,
    timeSpent: 0,
    taskStats: {} // This will store time spent per task
};
// Dark Mode Toggle (unchanged)
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    analyticsChart.options.scales.y.ticks.color = document.body.classList.contains('dark-mode') ? '#FDE2F3' : '#2A2F4F';
    analyticsChart.options.scales.x.ticks.color = document.body.classList.contains('dark-mode') ? '#FDE2F3' : '#2A2F4F';
    analyticsChart.update();
}
// Share Snapshot (unchanged)
async function shareSnapshot() {
    const stamp = document.getElementById('snapshot-stamp');
    stamp.textContent = new Date().toLocaleString();
    stamp.style.display = 'block';
    // Temporarily adjust the body and HTML to fit all content
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';
    // Calculate the full width and height of the document
    const fullWidth = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth
    );
    const fullHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight
    );
    // Use html2canvas to capture the entire page
    html2canvas(document.body, {
        width: fullWidth,
        height: fullHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        useCORS: true, // Enable if you have cross-origin images
        allowTaint: true, // Enable if you have tainted images
    }).then(canvas => {
        stamp.style.display = 'none';
        // Reset the body and HTML overflow styles
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        // Create a link to download the snapshot
        const link = document.createElement('a');
        link.href = canvas.toDataURL();
        link.download = `task-snapshot-${Date.now()}.png`;
        link.click();
    }).catch(error => {
        console.error('Error capturing snapshot:', error);
        stamp.style.display = 'none';
        // Reset the body and HTML overflow styles in case of error
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
    });
}
// Task Management (unchanged)
// Remove the duplicate createTaskElement function and modify the remaining one:
function createTaskElement(text, priorityColor, dueDate) {
    const task = document.createElement('div');
    task.className = 'task';
    task.id = `task-${Date.now()}`;
    task.draggable = true;
    
    // Store original values in data attributes
    const dueDateISO = dueDate ? new Date(dueDate).toISOString() : null;
    task.innerHTML = `
        <div class="priority-dot" 
             style="background: ${priorityColor}" 
             data-priority="${priorityColor}"></div>
        <div class="task-content">
            <p>${text}</p>
            ${dueDate ? `<small data-due="${dueDateISO}">Due: ${new Date(dueDate).toLocaleString()}</small>` : ''}
            <div class="task-timer">00:00</div>
            <div class="task-controls">
                <button onclick="startTimer(this)">▶ Play</button>
                <button onclick="pauseTimer(this)">⏸ Pause</button>
                <button onclick="resetTimer(this)">↻ Reset</button>
            </div>
        </div>
        <div class="task-actions">
            <button class="action-btn" onclick="editTask(this)">✎ Edit</button>
            <button class="action-btn" onclick="deleteTask(this)">✖ Delete</button>
        </div>
        <button class="move-btn" onclick="moveTask(this)">→ Move</button>
    `;

    if (!document.body.classList.contains('dark-mode')) {
        task.style.backgroundColor = getRandomColor();
    }
    return task;
}
function addTask() {
    console.log("Adding new task...");
    
    const taskText = document.getElementById('task-input').value.trim();
    const priorityColor = document.getElementById('priority-input').value;

    if (!taskText) return alert('Please enter a task!');

    const task = createTaskElement(taskText, priorityColor);
    document.getElementById('todo').appendChild(task);
    document.getElementById('task-input').value = '';

    saveTasks(); // 🔥 Ensure tasks are saved
    console.log("Task added and saved.");
}

function addScheduledTask() {
    const taskText = document.getElementById('task-for-date').value.trim();
    const dueDateTime = document.getElementById('task-datetime').value;
    if (!taskText || !dueDateTime) return alert('Please fill all fields!');
    const task = createTaskElement(taskText, document.getElementById('priority-input').value, dueDateTime);
    document.getElementById('todo').appendChild(task);
    closeCalendar();
    saveTasks();
    trackMetrics('add');
}
function moveTask(button) {
    const task = button.closest('.task');
    const currentColumn = task.parentElement.id;
    const columns = ['todo', 'in-progress', 'done'];
    const nextColumn = columns[(columns.indexOf(currentColumn) + 1) % columns.length];
    document.getElementById(nextColumn).appendChild(task);
    if (nextColumn === 'done') {
        trackMetrics('complete', task);
        celebrateTask(task);
    }
    saveTasks();
}
function celebrateTask(task) {
    const emojis = ['🎆', '🎊', '🎉'];
    emojis.forEach((emoji, index) => {
        setTimeout(() => {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.className = 'celebrate';
            span.style.position = 'absolute';
            span.style.left = `${Math.random() * 100}%`;
            span.style.top = `${Math.random() * 100}%`;
            task.appendChild(span);
            setTimeout(() => span.remove(), 2000); // 2 seconds
        }, index * 300);
    });
}
function editTask(button) {
    const task = button.closest('.task');
    const currentText = task.querySelector('p').textContent;
    const newText = prompt('Edit task:', currentText);
    if (newText !== null) {
        task.querySelector('p').textContent = newText;
        saveTasks();
    }
}
function deleteTask(button) {
    const task = button.closest('.task');
    task.remove();
    saveTasks();
    trackMetrics('delete');
}
// Timer Functionality (unchanged)
let timers = {};
function startTimer(button) {
    const taskElement = button.closest('.task');
    const timerDisplay = taskElement.querySelector('.task-timer');
    const taskId = taskElement.id;

    // ✅ Allow multiple timers to run, but prevent duplicate timers for the same task
    if (!timers[taskId]) { 
        let [minutes, seconds] = timerDisplay.textContent.split(':').map(Number);
        
        timers[taskId] = setInterval(() => {
            seconds++;
            if (seconds === 60) {
                seconds = 0;
                minutes++;
            }
            timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            saveTasks(); // 🔥 Auto-save the updated time
        }, 1000);
    }
}


function pauseTimer(button) {
    const taskElement = button.closest('.task');
    const taskId = taskElement.id;

    if (timers[taskId]) {
        clearInterval(timers[taskId]); // ❌ Stop only this task’s timer
        delete timers[taskId]; // ✅ Remove from active timers
    }

    saveTasks(); // 🔥 Save paused time
}


function resetTimer(button) {
    const taskElement = button.closest('.task');
    const timerDisplay = taskElement.querySelector('.task-timer');
    const taskId = taskElement.id;

    timerDisplay.textContent = '00:00';

    if (timers[taskId]) {
        clearInterval(timers[taskId]); // ❌ Stop only this task’s timer
        delete timers[taskId]; // ✅ Free up memory
    }

    saveTasks(); // 🔥 Save reset time
}


// Metrics Tracking
function trackMetrics(action, task) {
    const taskName = task ? task.querySelector('p').textContent : null;
    switch (action) {
        case 'add':
            break;
        case 'complete':
            metrics.completedTasks++;
            const timerText = task.querySelector('.task-timer').textContent;
            const [mins, secs] = timerText.split(':').map(Number);
            const timeSpent = mins + (secs / 60);
            metrics.timeSpent += timeSpent;
            metrics.taskStats[taskName] = (metrics.taskStats[taskName] || 0) + timeSpent;
            break;
        case 'delete':
            break;
    }
    updateMetrics();
    saveMetrics();
}
function updateMetrics() {
    console.log('Updating metrics...');
    console.log('Total Tasks:', metrics.totalTasks);
    console.log('Completed Tasks:', metrics.completedTasks);
    console.log('Time Spent:', metrics.timeSpent);
    function updateDayAndDate() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
        const now = new Date();
        const day = days[now.getDay()];
        const date = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    
        const currentDayElement = document.getElementById('current-day');
        const currentDateElement = document.getElementById('current-date');
    
        if (currentDayElement && currentDateElement) {
            currentDayElement.textContent = day;
            currentDateElement.textContent = date;
        } else {
            console.error('Elements for day and date not found.');
        }
    }
    
    // Call the function to update the day and date when the page loads
    updateDayAndDate();
    const completedTasksElement = document.getElementById('completed-tasks');
    if (completedTasksElement) {
        completedTasksElement.querySelector('p').textContent = metrics.completedTasks;
    } else {
        console.error('Element with ID "completed-tasks" not found.');
    }
    const avgTimeElement = document.getElementById('avg-time');
    if (avgTimeElement) {
        avgTimeElement.querySelector('p').textContent = `${Math.round(metrics.timeSpent)}m`;
    } else {
        console.error('Element with ID "avg-time" not found.');
    }
    // Update the chart with task names and time spent
    const taskNames = Object.keys(metrics.taskStats);
    analyticsChart.data.labels = taskNames;
    analyticsChart.data.datasets[0].data = taskNames.map(task => metrics.taskStats[task]);
    analyticsChart.update();
}
// Save/Load Metrics
function saveMetrics() {
    localStorage.setItem('taskMetrics', JSON.stringify(metrics));
}
function loadMetrics() {
    const saved = localStorage.getItem('taskMetrics');
    if (saved) metrics = JSON.parse(saved);
    updateMetrics();
}
// Save/Load Tasks (unchanged)
function saveTasks() {
    console.log("Saving tasks...");

    const tasks = {
        todo: Array.from(document.getElementById('todo').children).map(task => ({
            text: task.querySelector('.task-content p')?.textContent || '',
            priority: task.querySelector('.priority-dot')?.style.backgroundColor || '',
            dueDate: task.querySelector('small') ? task.querySelector('small').dataset.due : null,
            timer: task.querySelector('.task-timer')?.textContent || "00:00" // 🔥 Save timer
        })),
        'in-progress': Array.from(document.getElementById('in-progress').children).map(task => ({
            text: task.querySelector('.task-content p')?.textContent || '',
            priority: task.querySelector('.priority-dot')?.style.backgroundColor || '',
            dueDate: task.querySelector('small') ? task.querySelector('small').dataset.due : null,
            timer: task.querySelector('.task-timer')?.textContent || "00:00" // 🔥 Save timer
        })),
        done: Array.from(document.getElementById('done').children).map(task => ({
            text: task.querySelector('.task-content p')?.textContent || '',
            priority: task.querySelector('.priority-dot')?.style.backgroundColor || '',
            dueDate: task.querySelector('small') ? task.querySelector('small').dataset.due : null,
            timer: task.querySelector('.task-timer')?.textContent || "00:00" // 🔥 Save timer
        }))
    };

    localStorage.setItem('tasks', JSON.stringify(tasks));
    console.log("Tasks saved with timers:", tasks);
}


function loadTasks() {
    console.log("Loading tasks...");

    const saved = localStorage.getItem('tasks');
    
    if (!saved) {
        console.warn("No saved tasks found in localStorage.");
        return;
    }

    console.log("Retrieved from localStorage:", saved);

    const taskData = JSON.parse(saved);

    ['todo', 'in-progress', 'done'].forEach(status => {
        const column = document.getElementById(status);
        if (!column) return;

        column.innerHTML = `<h2>${column.getAttribute("data-heading")}</h2>`; // ✅ This keeps headings


        taskData[status].forEach(task => {
    if (!task.text || task.text.trim() === "") return; // ✅ Skip tasks without a name

    const taskElement = createTaskElement(
        task.text,
        task.priority,
        task.dueDate
    );

    taskElement.querySelector('.task-timer').textContent = task.timer;
    column.appendChild(taskElement);
});

    });

    console.log("Tasks loaded successfully with timers!");
}

// Calendar Functions (unchanged)
function openCalendar() {
    document.querySelector('.calendar-modal').style.display = 'block';
    document.querySelector('.overlay').style.display = 'block';
}
function closeCalendar() {
    document.querySelector('.calendar-modal').style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
}
// Drag & Drop (unchanged)
let draggedTask = null;
document.querySelectorAll('.column').forEach(column => {
    column.addEventListener('dragover', e => {
        e.preventDefault();
        column.style.backgroundColor = 'rgba(0,0,0,0.05)';
    });
    column.addEventListener('dragleave', () => {
        column.style.backgroundColor = '';
    });
    column.addEventListener('drop', () => {
        column.style.backgroundColor = '';
        if (draggedTask) {
            column.appendChild(draggedTask);
            saveTasks();
        }
    });
});
document.addEventListener('dragstart', e => {
    if (e.target.classList.contains('task')) {
        draggedTask = e.target;
        setTimeout(() => e.target.style.opacity = '0.5', 0);
    }
});
document.addEventListener('dragend', e => {
    if (e.target.classList.contains('task')) {
        e.target.style.opacity = '1';
        draggedTask = null;
    }
});
// Initialize (unchanged)
if(localStorage.getItem('darkMode') === 'true') toggleDarkMode();
loadMetrics();
loadTasks();
function toggleMenu() {
    const menuIcon = document.querySelector('.menu-icon');
    const navMenu = document.querySelector('.nav-menu');
    menuIcon.classList.toggle('active');
    navMenu.classList.toggle('active');
}
// Close menu when clicking outside
document.addEventListener('click', (event) => {
    const menuIcon = document.querySelector('.menu-icon');
    const navMenu = document.querySelector('.nav-menu');
    if (!menuIcon.contains(event.target) && !navMenu.contains(event.target)) {
        menuIcon.classList.remove('active');
        navMenu.classList.remove('active');
    }
});
// Function to generate a random light background color
function getRandomColor() {
    var r = Math.floor(Math.random() * 156) + 100; // Range: 100-255
    var g = Math.floor(Math.random() * 156) + 100; // Range: 100-255
    var b = Math.floor(Math.random() * 156) + 100; // Range: 100-255
    return `rgb(${r}, ${g}, ${b})`;
}
// Function to create a task element
function createTaskElement(text, priorityColor, dueDate) {
    const task = document.createElement('div');
    task.className = 'task';
    task.id = `task-${Date.now()}`;
    task.draggable = true;
    // Apply a random light background color only in light mode
    if (!document.body.classList.contains('dark-mode')) {
        task.style.backgroundColor = getRandomColor();
    }
    task.innerHTML = `
        <div class="priority-dot" style="background: ${priorityColor}"></div>
        <div class="task-content">
            <p>${text}</p>
            ${dueDate ? `<small>Due: ${new Date(dueDate).toLocaleString()}</small>` : ''}
            <div class="task-timer">00:00</div>
            <div class="task-controls">
                <button onclick="startTimer(this)">▶ Play</button>
                <button onclick="pauseTimer(this)">⏸ Pause</button>
                <button onclick="resetTimer(this)">↻ Reset</button>
            </div>
        </div>
        <div class="task-actions">
            <button class="action-btn" onclick="editTask(this)">✎ Edit</button>
            <button class="action-btn" onclick="deleteTask(this)">✖ Delete</button>
        </div>
        <button class="move-btn" onclick="moveTask(this)">→ Move</button>
    `;
    return task;
}
// Add this to your JavaScript
// Timer Options Modal
function openTimerOptions() {
    const modal = document.getElementById('timer-options-modal');
    modal.classList.add('active');
}
function closeTimerOptionsModal() {
    const modal = document.getElementById('timer-options-modal');
    modal.classList.remove('active');
}
// Countdown Timer
let countdownInterval;
let countdownTime = 0;
function startCountdownTimer(minutes) {
    countdownTime = minutes * 60;
    closeTimerOptionsModal();
    const globalTimer = document.getElementById('global-timer');
    globalTimer.classList.add('active');
    countdownInterval = setInterval(() => {
        if (countdownTime <= 0) {
            clearInterval(countdownInterval);
            showNotification('Timer Complete', 'Your timer has ended!');
            playNotificationSound();
            alert('Timer Complete!'); // Forced alert
            globalTimer.classList.remove('active');
            return;
        }
        const minutesLeft = Math.floor(countdownTime / 60);
        const secondsLeft = countdownTime % 60;
        document.getElementById('countdown-display').textContent = 
            `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
        countdownTime--;
    }, 1000);
}
function pauseCountdownTimer() {
    clearInterval(countdownInterval);
}
function resetCountdownTimer() {
    clearInterval(countdownInterval);
    countdownTime = 0;
    document.getElementById('countdown-display').textContent = '00:00';
    document.getElementById('global-timer').classList.remove('active');
}
// Show Notification
function showNotification(title, message) {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827504.png' // Optional: Add an icon
        });
    } else {
        console.warn('Notification permission not granted.');
    }
}
// Play Notification Sound
function playNotificationSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2993/2993-preview.mp3'); // Add a sound file URL
    audio.play();
}
// FAB Menu Toggle
function toggleFabMenu() {
    const fabMenu = document.querySelector('.fab-menu');
    fabMenu.classList.toggle('active');
}
// Add this DRAGGABLE TIMER CODE
let isDragging = false;
let offsetX = 0;
let offsetY = 0;
document.addEventListener('DOMContentLoaded', () => {
    const globalTimer = document.getElementById('global-timer');
    
    // Start dragging
    globalTimer.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = globalTimer.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        globalTimer.style.cursor = 'grabbing';
        globalTimer.style.right = 'auto'; // Reset right/bottom
        globalTimer.style.bottom = 'auto';
    });
    // Move timer
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        globalTimer.style.left = `${x}px`;
        globalTimer.style.top = `${y}px`;
    });
    // Stop dragging
    document.addEventListener('mouseup', () => {
        isDragging = false;
        globalTimer.style.cursor = 'grab';
    });
});
window.onload = function () {
    loadTasks(); // ✅ Load tasks from localStorage

    // ✅ Reattach event listeners to timers after reload
    setTimeout(() => {
        document.querySelectorAll(".task").forEach(task => {
            attachTimerEvents(task);
        });
    }, 500);
};
// Add this function to your script.js
async function clearAllData() {
    try {
        // Clear localStorage
        localStorage.clear();

        // Clear sessionStorage (if used)
        sessionStorage.clear();

        // Clear IndexedDB (if used)
        if (window.indexedDB && window.indexedDB.databases) {
            const databases = await window.indexedDB.databases();
            for (const db of databases) {
                window.indexedDB.deleteDatabase(db.name);
            }
        }

        // Clear service worker cache (if any)
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
                await caches.delete(cacheName);
            }
        }

        // Clear cookies (if used)
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }

        // Reset metrics
        metrics = {
            completedTasks: 0,
            timeSpent: 0,
            taskStats: {}
        };

        // Reset the chart
        analyticsChart.data.labels = [];
        analyticsChart.data.datasets[0].data = [];
        analyticsChart.update();

        // Update the metrics display
        updateMetrics();

        // Force a hard reload to clear cache and reload the page
        window.location.reload(true); // `true` forces a reload from the server, bypassing cache
    } catch (error) {
        console.error('Error clearing all data:', error);
        alert('Failed to clear all data. Please try again.');
    }
}
// Add Enter key support for task input
document.getElementById('task-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        addTask(); // Trigger the existing addTask function
    }
});
function attachTimerEvents(task) {
    const timer = task.querySelector(".task-timer");
    const startButton = task.querySelector(".start-timer");
    const stopButton = task.querySelector(".stop-timer");

    if (timer && startButton) {
        startButton.addEventListener("click", () => {
            if (!timer.dataset.running) {
                startTimer(timer);
            }
        });
    }

    if (timer && stopButton) {
        stopButton.addEventListener("click", () => {
            stopTimer(timer);
        });
    }
}
