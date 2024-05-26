import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

import { get } from "aws-amplify/api"
import {Amplify} from "aws-amplify"
const existingConfig = Amplify.getConfig() 
const client = generateClient<Schema>();

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './todos.component.html',
  styleUrl: './todos.component.css',
})
export class TodosComponent implements OnInit {
  todos: any[] = [];
  manojData: any = []

  ngOnInit(): void {
    this.listTodos();
    this.manojTest();
  }

  listTodos() {
    try {
      client.models.Todo.observeQuery().subscribe({
        next: ({ items, isSynced }) => {
          this.todos = items;
        },
      });
    } catch (error) {
      console.error('error fetching todos', error);
    }
  }

  createTodo() {
    try {
      client.models.Todo.create({
        content: window.prompt('Todo content'),
      });
      this.listTodos();
    } catch (error) {
      console.error('error creating todos', error);
    }
  }

  deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }

  manojTest() {
    this.manojData = JSON.stringify({ name: "manoj" })
    console.log(existingConfig)
    this.getItem()

  }

  async getItem() {
    try {
      const restOperation = get({
        apiName: 'manojRestApi',
        path: 'items'
      });
      const response = await restOperation.response;
      console.log('GET call succeeded: ', response);
      window.alert(JSON.stringify(response))
      this.manojData = JSON.stringify(response)
    } catch (error:any) {
      console.log('GET call failed: check below');
      console.log(error)
    }
  }
}
