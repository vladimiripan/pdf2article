import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, Observable, of } from 'rxjs';
import * as PDFJS from 'pdfjs-dist';

const pdflib = PDFJS as any;

export enum AnnotationType {
  Article = 'article',
  Author = 'author',
  Title = 'title',
  Content = 'content'
}

export interface Annotation {
  x: number;
  y: number;
  xEnd: number;
  yEnd: number;
  page: number;
  pairKey?: number;
  tag?: string;
}

interface IPageDimensions {
  width: number;
  height: number;
}

export interface IPageProperties {
  pageIndex: number;
  pageDimensions: IPageDimensions;
}

export enum WorkMode {
  Create = 'create',
  Delete = 'delete'
}

@Injectable({
  providedIn: 'root'
})
export class AnnotatorService {

  private pdf: any;

  private pages: HTMLElement[] = [];

  private annotations: Annotation[] = [];
  private annotationType: AnnotationType;

  private articleID: number = 0;

  private pagesProperties: IPageProperties[] = [];

  private workMode: BehaviorSubject<WorkMode> = new BehaviorSubject<WorkMode>(WorkMode.Create);

  constructor(private http: HttpClient) { }

  public clear() {
    this.annotations = [];
    this.articleID = 0;
    this.annotationType = null;
    this.workMode.next(WorkMode.Create);
    this.pagesProperties = [];
    this.pdf = null;
  }

  public setServerAnnotations(annotations: Annotation[]) {
    annotations.forEach((annotation) => {
      this.setAnnotation(annotation);
    });
  }

  public setAnnotation(annotation: Annotation): void {
    this.annotations.push(Object.assign({}, annotation));
  }

  public getAnnotations(page: number) {
    return this.annotations
               .filter(annotation => annotation.page === page)
               .map(annotation => Object.assign({}, annotation));
  }

  public getAnnotationType(): AnnotationType {
    return this.annotationType;
  }

  public setAnnotationType(type: AnnotationType): void {
    this.annotationType = type;
    this.workMode.next(WorkMode.Create);
  }

  public setPagesProperties(pageProperties: IPageProperties): void {
    if (this.pagesProperties.findIndex(page => page.pageIndex === pageProperties.pageIndex) === -1) {
      this.pagesProperties.push(pageProperties);
    }
  }

  /**
   * Return the annotations to match the server response
   */
  public flushAnnotations() {
    this.annotations = [];
  }

  public getTrainingData(): any {
    return this.http.get('/api/training');
  }

  public getAnnotationMetadata(id: string) {
    return this.http.get(`/api/training/metadata/${id}`);
  }

  public saveMetadata(id: string) {
    const payload = this.annotations
      .filter(annotation => annotation.tag !== AnnotationType.Article);
    const pagesProperties = this.pagesProperties;

    return this.http.post(`/api/training/metadata/${id}`, { payload, pagesProperties });
  }

  public getArticle(x: number, y: number, page: number) {
    return this.getAnnotationFromCoords(x, y, page)
      .filter(annotation => annotation.tag === AnnotationType.Article);
  }

  public getAnnotationFromCoords(x: number, y: number, page: number) {
    return this.annotations.filter(annotation => this.hasAnnotation(x, y, page, annotation));
  }

  public remove(x: number, y: number, page: number) {
    const annotations = this.getAnnotationFromCoords(x, y, page);
    const article = annotations.find(annotation => annotation.tag === AnnotationType.Article);

    if (article) {
      this.removeArticle(article);
    } else {
      this.annotations = this.annotations.filter(annotation => !this.hasAnnotation(x, y, page, annotation));
    }
  }

  public getNextArticleID(): number {
    this.articleID++;
    return this.articleID;
  }

  public setWorkMode(mode: WorkMode): void {
    this.workMode.next(mode);
  }

  public getWorkMode(): Observable<WorkMode> {
    return this.workMode.asObservable();
  }

  public fetchPDF(documentUrl: string) {
    return pdflib.getDocument(documentUrl)
      .then((pdf) => {
        this.pdf = pdf;
        return this.getPDFInfo();
      });
  }

  public getPDFInfo() {
    return this.pdf._pdfInfo;
  }

  public fetchPages(pages: number[]) {
    const pagePromises = pages.map(index => this.pdf.getPage(index));
    return Promise.all(pagePromises);
  }

  public async render(documentUrl: string) {
    try {
      this.pdf = await pdflib.getDocument(documentUrl);

      const { numPages } = this.pdf._pdfInfo;
      for (let i = 1; i <= numPages; i++) {
        const page = await this.pdf.getPage(i);
        this.pages.push(page);
      }

      return this.pages;
    } catch (error) {
      throw new Error(error.message);;
    }
  }

  private hasAnnotation(x: number, y: number, page: number, annotation: Annotation): boolean {
    return (
      x >= annotation.x && x <= (annotation.xEnd + annotation.x ) &&
      y >= annotation.y && y <= (annotation.yEnd + annotation.y) &&
      page === annotation.page
    );
  }

  private removeArticle(article: Annotation) {
    this.annotations = this.annotations.filter(annotation => annotation.pairKey !== article.pairKey);
  }
}
