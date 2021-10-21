import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { startWith, throttleTime } from 'rxjs/operators';
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
  styleUrls: ['./pick-reqbaz-project.component.scss'],
})
export class PickReqbazProjectComponent implements OnInit {
  selectedProjectControl = new FormControl();
  selectedCategoryControl = new FormControl();
  selectedProject: Project;
  selectedCategory: Category;
  private availableCategories$ = new BehaviorSubject<Category[]>([]);
  private availableProjects$ = new BehaviorSubject<Project[]>([]);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  availableProjects = this.availableProjects$.asObservable();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  availableCategories = this.availableCategories$.asObservable();
  private subscriptions$: Subscription[] = [];

  constructor(private las2peer: Las2peerService) {}

  ngOnInit(): void {
    let sub = this.selectedProjectControl.valueChanges
      .pipe(startWith(''), throttleTime(100))
      .subscribe((value) => {
        void this._filterProject(value);
      });
    this.subscriptions$.push(sub);
    sub = this.selectedCategoryControl.valueChanges
      .pipe(startWith(''), throttleTime(100))
      .subscribe((value) => {
        void this._filterCategory(value);
      });
    this.subscriptions$.push(sub);
  }

  projectDisplay(project?: Project): string | undefined {
    return project ? project.name : undefined;
  }

  categoryDisplay(category?: Category): string | undefined {
    return category ? category.name : undefined;
  }

  async _filterProject(value: string): Promise<void> {
    const projects = await this.las2peer.searchProjectOnReqBaz(value);

    if (projects) this.availableProjects$.next(projects as Project[]);
  }

  async _filterCategory(value: string): Promise<void> {
    if (!this.selectedProject) {
      this.availableCategories$.next([]);
      return;
    }
    const categories = await this.las2peer.searchCategoryOnReqBaz(
      this.selectedProject.id,
      value,
    );

    if (categories)
      this.availableCategories$.next(categories as any[]);
  }
}
