import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private api = '/api/customers';
  constructor(private http: HttpClient) {}

  searchCustomers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/search`, { params: { q: query } });
  }

  getCustomerById(id: string): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`);
  }
}
