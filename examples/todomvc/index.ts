import * as sp from '../../spui/index';
import * as utils from '../../spui/utils';
const h = sp.h;

class Todo {
    title: sp.Stream;
    completed: sp.Stream;
    constructor(title: string) {
        this.title = sp.valueStream(title);
        this.completed = sp.valueStream(false);
    }
}
class Store {
    todos: sp.ObservableArray<Todo>;
    todoFilter: sp.Filter<Todo>;
    editing: sp.Stream = sp.valueStream(null);
    todoCount: sp.Stream = sp.valueStream(0);
    remaining: sp.Stream = sp.valueStream(0);
    filterName: sp.Stream = sp.valueStream('all');
    constructor() {
        this.todos = new sp.ObservableArray<Todo>();
        this.todoFilter = new sp.Filter<Todo>(this.todos, this.isTodoFiltered.bind(this));
        this.todos.addListener(() => {
            this.updateState();
        });
    }
    createTodo (title: string) {
        this.todos.push(new Todo(title));
    }
    setAllCompleted(completed: boolean) {
        for (let i = 0; i < this.todos.length; ++i) {
            this.todos.array[i].completed(completed);
        }
        this.updateState();
    }
    setCompleted(todo: Todo, completed: boolean) {
        todo.completed(completed);
        this.updateState();
    }
    destroy(todo: Todo) {
        this.todos.remove(todo);
    }
    clearCompleted() {
        this.todos.applyChanges(() => {
            let i = 0;
            while (i < this.todos.length) {
                if (this.todos[i].completed()) {
                    this.todos.splice(i, 1);
                } else {
                    ++i;
                }
            }
        });
    }
    edit(todo: Todo) {
        this.editing(todo);
    }
    updateTitle(title: string) {
        if (this.editing()) {
            this.editing().title(title);
            this.reset();
        }
    }
    reset() {
        this.editing(null);
    }

    isTodoFiltered(todo: Todo) {
        switch (this.filterName()) {
            case 'active': return !todo.completed();
            case 'completed': return todo.completed();
            default: case 'all': return true;
        }
    }

    applyFilter(filterName: string) {
        this.filterName(filterName);
        this.updateState();
    }

    updateState() {
        this.todoFilter.applyFilter();
        if (this.todoCount() !== this.todos.length) {
            this.todoCount(this.todos.length);
        }
        const remaining = this.todos.array.filter(todo => !todo.completed()).length;
        if (remaining !== this.remaining()) {
            this.remaining(remaining);
        }
    }
}

class App {
    store: Store;
    toggleAllElement: HTMLInputElement;
    constructor(store: Store) {
        this.store = store;
    }

    add(e) {
        this.store.createTodo(e.target.value);
        e.target.value = '';
    }

    edit(todo: Todo, inputElement: HTMLInputElement) {
        this.store.edit(todo);
        inputElement.value = todo.title();
    }

    toggleAll() {
        this.store.setAllCompleted(this.toggleAllElement.checked);
    }

    toggle(todo: Todo, e: MouseEvent) {
        this.store.setCompleted(todo, !todo.completed());
    }

    createView() {
        const visibleIfAnyTodo = () => {
            return this.store.todoCount() > 0 ? '' : 'none';
        }

        return h('section', { id: 'todoapp' }, [
            h('header', {class: 'header'}, [
                h('h1', {}, 'todos'),
                h('input', {id: 'new-todo', placeholder: 'What needs to be done?', autofocus: true, onchange: this.add.bind(this) })
            ]),
            h('section', { id: 'main', style: { display: visibleIfAnyTodo } }, [
                this.toggleAllElement = h('input', {id: 'toggle-all', type: 'checkbox', checked: () => this.store.remaining() === 0, onclick: () => this.toggleAll() }) as HTMLInputElement,
                h('label', { for: 'toggle-all', onclick: this.toggleAll.bind(this) }, 'Mark all as complete'),
                sp.elementList('ul', {id: 'todo-list'}, this.store.todoFilter.filtered, (listElement, todo: Todo) => {
                    let inputTitleElement;
                    return h('li', { class: {completed: todo.completed,  editing: () => todo === this.store.editing() } }, [
                        h('div', {class: 'view'}, [
                            h('input', {class: 'toggle', type: 'checkbox', checked: todo.completed, onclick: this.toggle.bind(this, todo) }),
                            h('label', { disabled: todo.completed, ondblclick: () => this.edit(todo, inputTitleElement) }, todo.title),
                            h('button', {class: 'destroy', onclick: () => this.store.destroy(todo) }),
                        ]),
                        inputTitleElement = h('input', { class: 'edit', onchange: sp.targetAttr('value', this.store.updateTitle.bind(this.store)) })
                    ])
                }),
            ]),
            h('footer', { id: 'footer', style: { display: visibleIfAnyTodo } }, [
                h('span', {id: 'todo-count'}, [
                    h('strong', {}, () => this.store.remaining()),
                    () => this.store.remaining() === 1 ? ' item left' : ' items left'
                ]),
                h('ul', {id: 'filters'}, [
                    h('li', {}, h('a', { class: { selected: () => this.store.filterName() === 'all' }, onclick: () => this.store.applyFilter('all') }, 'All')),
                    h('li', {}, h('a', { class: { selected: () => this.store.filterName() === 'active' }, onclick: () => this.store.applyFilter('active') }, 'Active')),
                    h('li', {}, h('a', { class: { selected: () => this.store.filterName() === 'completed' }, onclick: () => this.store.applyFilter('completed') }, 'Completed')),
                ]),
                h('button', {id: 'clear-completed', onclick: () => this.store.clearCompleted() }, 'Clear completed')
            ])
        ]);
    }
}

const store = new Store();
const app = new App(store);
const view = app.createView();
document.body.insertBefore(view, document.body.firstChild);
