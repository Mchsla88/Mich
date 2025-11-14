import { useState, useCallback, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, CellValueChangedEvent } from 'ag-grid-community';
import axios from 'axios';
import { CRMRow, ResearchResponse, EmailGenerationResponse } from './types';
import { Save, Plus, Trash2, Download, Upload } from 'lucide-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './App.css';

const App = () => {
  const [rowData, setRowData] = useState<CRMRow[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      email: '',
      company: '',
      website: '',
      position: '',
      promptResearch: 'Znajdź informacje o tej firmie: jej produktach, usługach, ostatnich aktualnościach i kluczowych osobach.',
      promptSequence: 'Napisz profesjonalną sekwencję 3 emaili do potencjalnego klienta, każdy kolejny bardziej przekonujący.',
      researchResults: '',
      status: 'Draft',
      email1: '',
      dataEmail1: '',
      email2: '',
      dataEmail2: '',
      email3: '',
      dataEmail3: '',
      notes: ''
    }
  ]);

  const gridRef = useRef<AgGridReact>(null);

  // Automatyczna obsługa zmian statusu
  const handleCellValueChanged = useCallback(async (event: CellValueChangedEvent) => {
    const updatedRow: CRMRow = event.data;

    // Jeśli zmieniono status na "Generate" i są wymagane dane
    if (event.colDef.field === 'status' && updatedRow.status === 'Generate') {
      // Walidacja
      if (!updatedRow.company && !updatedRow.website && !updatedRow.email) {
        alert('Musisz podać co najmniej: Firmę, Stronę WWW lub Email');
        updatedRow.status = 'Draft';
        event.api.applyTransaction({ update: [updatedRow] });
        return;
      }

      if (!updatedRow.promptResearch) {
        alert('Musisz podać Prompt Research');
        updatedRow.status = 'Draft';
        event.api.applyTransaction({ update: [updatedRow] });
        return;
      }

      // Uruchom research
      await performResearch(updatedRow, event.api);
    }
  }, []);

  const performResearch = async (row: CRMRow, api: any) => {
    try {
      // Ustaw status na "Researching"
      row.status = 'Researching';
      api.applyTransaction({ update: [row] });

      // Wywołaj API do researchu
      const response = await axios.post<ResearchResponse>('/api/research', {
        rowId: row.id,
        company: row.company,
        website: row.website,
        email: row.email,
        promptResearch: row.promptResearch
      });

      if (response.data.success) {
        // Aktualizuj Research Results
        row.researchResults = response.data.researchResults;
        row.status = 'Generating Emails';
        api.applyTransaction({ update: [row] });

        // Automatycznie generuj emaile
        await generateEmails(row, api);
      } else {
        row.status = 'Draft';
        api.applyTransaction({ update: [row] });
        alert('Błąd podczas researchu');
      }
    } catch (error) {
      console.error('Research error:', error);
      row.status = 'Draft';
      api.applyTransaction({ update: [row] });
      alert('Błąd połączenia z API');
    }
  };

  const generateEmails = async (row: CRMRow, api: any) => {
    try {
      if (!row.researchResults) {
        alert('Brak wyników researchu');
        return;
      }

      if (!row.promptSequence) {
        alert('Musisz podać Prompt Sekwencja');
        row.status = 'Draft';
        api.applyTransaction({ update: [row] });
        return;
      }

      // Wywołaj API do generowania emaili
      const response = await axios.post<EmailGenerationResponse>('/api/generate-emails', {
        rowId: row.id,
        researchResults: row.researchResults,
        promptSequence: row.promptSequence,
        recipientName: row.name,
        recipientEmail: row.email,
        company: row.company
      });

      if (response.data.success) {
        // Aktualizuj emaile i daty
        const now = new Date().toISOString().split('T')[0];
        row.email1 = response.data.email1;
        row.dataEmail1 = now;
        row.email2 = response.data.email2;
        row.dataEmail2 = now;
        row.email3 = response.data.email3;
        row.dataEmail3 = now;
        row.status = 'Complete';
        api.applyTransaction({ update: [row] });
      } else {
        row.status = 'Draft';
        api.applyTransaction({ update: [row] });
        alert('Błąd podczas generowania emaili');
      }
    } catch (error) {
      console.error('Email generation error:', error);
      row.status = 'Draft';
      api.applyTransaction({ update: [row] });
      alert('Błąd połączenia z API');
    }
  };

  const columnDefs: ColDef<CRMRow>[] = [
    { field: 'name', headerName: 'Imię i Nazwisko', editable: true, width: 180 },
    { field: 'email', headerName: 'Email', editable: true, width: 200 },
    { field: 'company', headerName: 'Firma', editable: true, width: 150 },
    { field: 'website', headerName: 'Strona WWW', editable: true, width: 180 },
    { field: 'position', headerName: 'Stanowisko', editable: true, width: 150 },
    {
      field: 'promptResearch',
      headerName: 'Prompt Research',
      editable: true,
      width: 250,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorParams: {
        maxLength: 1000,
        rows: 4,
        cols: 50
      }
    },
    {
      field: 'promptSequence',
      headerName: 'Prompt Sekwencja',
      editable: true,
      width: 250,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorParams: {
        maxLength: 1000,
        rows: 4,
        cols: 50
      }
    },
    {
      field: 'researchResults',
      headerName: 'Research Results',
      editable: true,
      width: 300,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorParams: {
        maxLength: 5000,
        rows: 10,
        cols: 60
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      editable: true,
      width: 150,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Draft', 'Generate', 'Researching', 'Generating Emails', 'Complete']
      },
      cellStyle: (params) => {
        if (params.value === 'Complete') return { backgroundColor: '#d4edda', color: '#155724' };
        if (params.value === 'Researching') return { backgroundColor: '#fff3cd', color: '#856404' };
        if (params.value === 'Generating Emails') return { backgroundColor: '#d1ecf1', color: '#0c5460' };
        if (params.value === 'Generate') return { backgroundColor: '#f8d7da', color: '#721c24' };
        return {};
      }
    },
    {
      field: 'email1',
      headerName: 'Email 1',
      editable: true,
      width: 300,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorParams: {
        maxLength: 5000,
        rows: 10,
        cols: 60
      }
    },
    { field: 'dataEmail1', headerName: 'Data Email 1', editable: true, width: 130 },
    {
      field: 'email2',
      headerName: 'Email 2',
      editable: true,
      width: 300,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorParams: {
        maxLength: 5000,
        rows: 10,
        cols: 60
      }
    },
    { field: 'dataEmail2', headerName: 'Data Email 2', editable: true, width: 130 },
    {
      field: 'email3',
      headerName: 'Email 3',
      editable: true,
      width: 300,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorParams: {
        maxLength: 5000,
        rows: 10,
        cols: 60
      }
    },
    { field: 'dataEmail3', headerName: 'Data Email 3', editable: true, width: 130 },
    {
      field: 'notes',
      headerName: 'Notatki',
      editable: true,
      width: 250,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorParams: {
        maxLength: 2000,
        rows: 6,
        cols: 50
      }
    }
  ];

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  const addRow = () => {
    const newRow: CRMRow = {
      id: crypto.randomUUID(),
      name: '',
      email: '',
      company: '',
      website: '',
      position: '',
      promptResearch: 'Znajdź informacje o tej firmie: jej produktach, usługach, ostatnich aktualnościach i kluczowych osobach.',
      promptSequence: 'Napisz profesjonalną sekwencję 3 emaili do potencjalnego klienta, każdy kolejny bardziej przekonujący.',
      researchResults: '',
      status: 'Draft',
      email1: '',
      dataEmail1: '',
      email2: '',
      dataEmail2: '',
      email3: '',
      dataEmail3: '',
      notes: ''
    };
    setRowData([...rowData, newRow]);
  };

  const deleteSelectedRows = () => {
    const selectedRows = gridRef.current?.api.getSelectedRows();
    if (selectedRows && selectedRows.length > 0) {
      const updatedData = rowData.filter(row => !selectedRows.includes(row));
      setRowData(updatedData);
    }
  };

  const saveToJSON = () => {
    const dataStr = JSON.stringify(rowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const loadFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setRowData(data);
        } catch (error) {
          alert('Błąd wczytywania pliku JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Excel CRM z Gemini AI Research</h1>
        <div className="toolbar">
          <button onClick={addRow} className="btn btn-primary">
            <Plus size={18} /> Dodaj wiersz
          </button>
          <button onClick={deleteSelectedRows} className="btn btn-danger">
            <Trash2 size={18} /> Usuń zaznaczone
          </button>
          <button onClick={saveToJSON} className="btn btn-success">
            <Download size={18} /> Eksportuj JSON
          </button>
          <label className="btn btn-info">
            <Upload size={18} /> Importuj JSON
            <input
              type="file"
              accept=".json"
              onChange={loadFromJSON}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </header>

      <div className="ag-theme-alpine grid-container">
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection="multiple"
          onCellValueChanged={handleCellValueChanged}
          animateRows={true}
          pagination={true}
          paginationPageSize={20}
        />
      </div>

      <footer className="app-footer">
        <p>Zmień status na "Generate" aby automatycznie uruchomić research i generowanie emaili</p>
      </footer>
    </div>
  );
};

export default App;
