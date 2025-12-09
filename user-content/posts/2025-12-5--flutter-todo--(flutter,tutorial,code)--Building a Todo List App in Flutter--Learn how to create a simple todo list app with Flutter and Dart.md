In this tutorial, we'll build a simple yet functional todo list app using Flutter and Dart. This is a great project for beginners to learn state management, list handling, and user input in Flutter.

## Prerequisites

- Flutter SDK installed
- Dart knowledge (basic)
- A code editor (VS Code or Android Studio recommended)

## Project Setup

First, create a new Flutter project:

```bash
flutter create todo_app
cd todo_app
```

## Step 1: Create the Todo Model

Create a new file `lib/models/todo.dart`:

```dart
class Todo {
  final String id;
  final String title;
  bool isCompleted;

  Todo({
    required this.id,
    required this.title,
    this.isCompleted = false,
  });

  void toggleComplete() {
    isCompleted = !isCompleted;
  }
}
```

## Step 2: Create the Main App

Update `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'models/todo.dart';

void main() {
  runApp(const TodoApp());
}

class TodoApp extends StatelessWidget {
  const TodoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Todo App',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const TodoListScreen(),
    );
  }
}
```

## Step 3: Build the Todo List Screen

Create `lib/screens/todo_list_screen.dart`:

```dart
import 'package:flutter/material.dart';
import '../models/todo.dart';

class TodoListScreen extends StatefulWidget {
  const TodoListScreen({super.key});

  @override
  State<TodoListScreen> createState() => _TodoListScreenState();
}

class _TodoListScreenState extends State<TodoListScreen> {
  final List<Todo> _todos = [];
  final TextEditingController _textController = TextEditingController();

  void _addTodo(String title) {
    if (title.trim().isEmpty) return;

    setState(() {
      _todos.add(Todo(
        id: DateTime.now().toString(),
        title: title.trim(),
      ));
    });
    _textController.clear();
  }

  void _toggleTodo(Todo todo) {
    setState(() {
      todo.toggleComplete();
    });
  }

  void _deleteTodo(Todo todo) {
    setState(() {
      _todos.remove(todo);
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Todo List'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: const InputDecoration(
                      hintText: 'Enter a new todo',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: _addTodo,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.add),
                  onPressed: () => _addTodo(_textController.text),
                  tooltip: 'Add todo',
                ),
              ],
            ),
          ),
          Expanded(
            child: _todos.isEmpty
                ? const Center(
                    child: Text(
                      'No todos yet!\nAdd one above to get started.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  )
                : ListView.builder(
                    itemCount: _todos.length,
                    itemBuilder: (context, index) {
                      final todo = _todos[index];
                      return Dismissible(
                        key: Key(todo.id),
                        background: Container(
                          color: Colors.red,
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        direction: DismissDirection.endToStart,
                        onDismissed: (direction) => _deleteTodo(todo),
                        child: ListTile(
                          leading: Checkbox(
                            value: todo.isCompleted,
                            onChanged: (_) => _toggleTodo(todo),
                          ),
                          title: Text(
                            todo.title,
                            style: TextStyle(
                              decoration: todo.isCompleted
                                  ? TextDecoration.lineThrough
                                  : null,
                              color: todo.isCompleted
                                  ? Colors.grey
                                  : null,
                            ),
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () => _deleteTodo(todo),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
```

## Step 4: Update main.dart

Update `lib/main.dart` to import the screen:

```dart
import 'package:flutter/material.dart';
import 'screens/todo_list_screen.dart';

void main() {
  runApp(const TodoApp());
}

class TodoApp extends StatelessWidget {
  const TodoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Todo App',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const TodoListScreen(),
    );
  }
}
```

## Features Implemented

✅ **Add Todos**: Enter text and press Enter or click the add button  
✅ **Complete Todos**: Tap the checkbox to mark as complete  
✅ **Delete Todos**: Swipe left or tap the delete icon  
✅ **Visual Feedback**: Completed todos are crossed out and grayed  
✅ **Empty State**: Shows a message when no todos exist  

## Running the App

```bash
flutter run
```

## Next Steps

Here are some ideas to extend this app:

1. **Persistence**: Save todos to local storage using `shared_preferences` or `sqflite`
2. **Categories**: Add categories or tags to organize todos
3. **Due Dates**: Add date picker for todo deadlines
4. **Search**: Implement search functionality to filter todos
5. **Themes**: Add dark mode support
6. **Animations**: Add smooth animations for adding/removing todos

## Key Concepts Learned

- **State Management**: Using `setState()` to update the UI
- **List Handling**: Working with `ListView.builder` for dynamic lists
- **User Input**: Handling text input with `TextField` and `TextEditingController`
- **Gestures**: Implementing swipe-to-delete with `Dismissible`
- **Widget Composition**: Building complex UIs from simple widgets

## Conclusion

You've built a functional todo list app! This foundation can be extended with many features. Flutter's widget system makes it easy to build beautiful, responsive apps quickly.

Happy coding! 🚀

