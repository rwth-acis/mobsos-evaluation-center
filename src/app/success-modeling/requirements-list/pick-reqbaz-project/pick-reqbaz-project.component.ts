import {Component, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {BehaviorSubject} from 'rxjs';
import {startWith} from 'rxjs/operators';
import { Las2peerService } from 'src/app/services/las2peer.service';

interface Project {
  name: string;
  id: number;
}

interface Category {
  name: string;
  id: number;
}

@Component({
  selector: 'app-pick-reqbaz-project',
  templateUrl: './pick-reqbaz-project.component.html',
  styleUrls: ['./pick-reqbaz-project.component.scss']
})
export class PickReqbazProjectComponent implements OnInit {
  selectedProjectControl = new FormControl();
  selectedCategoryControl = new FormControl();
  selectedProject: Project;
  selectedCategory: Category;
  private availableProjectsSubject = new BehaviorSubject<Project[]>([]);
  availableProjects = this.availableProjectsSubject.asObservable();
  private availableCategoriesSubject = new BehaviorSubject<Category[]>([]);
  availableCategories = this.availableCategoriesSubject.asObservable();

  constructor(private las2peer: Las2peerService) {
  }

  ngOnInit() {
    this.selectedProjectControl.valueChanges.pipe(startWith('')).subscribe(value => {
      this._filterProject(value);
    });
    this.selectedCategoryControl.valueChanges.pipe(startWith('')).subscribe(value => {
      this._filterCategory(value);
    });
  }

  projectDisplay(project?: Project): string | undefined {
    return project ? project.name : undefined;
  }

  categoryDisplay(category?: Category): string | undefined {
    return category ? category.name : undefined;
  }

  _filterProject(value: string) {
    this.las2peer.searchProjectOnReqBaz(value)
      .then(projects => this.availableProjectsSubject.next(projects as Project[]));
  }

  _filterCategory(value: string) {
    if (!this.selectedProject) {
      this.availableCategoriesSubject.next([]);
      return;
    }
    this.las2peer.searchCategoryOnReqBaz(this.selectedProject.id, value)
      .then(categories => this.availableCategoriesSubject.next(categories as any[]));
  }
}
