import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { themeQuartz } from "ag-grid-community";

import "./JobList.css";

const API_BASE_URL = "http://localhost:8000";
const STATUS_OPTIONS = ["Applied", "Interviewing", "Offered", "Accepted", "Rejected", "Withdrawn"];
const OFFER_STATUS_OPTIONS = ["None", "Offered", "Accepted", "Rejected"];

const EMPTY_JOB = {
    job_title: "",
    company_name: "",
    location: "",
    applied_date: "",
    salary: "",
    status: "Applied",
    current_round: "",
    interview_date: "",
    offer_status: "None",
    remarks: ""
};

function formatDateValue(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function JobList({ onLogout }) {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(12);
    const [currentPage, setCurrentPage] = useState(1);
    const [draftJob, setDraftJob] = useState(EMPTY_JOB);
    const [isAdding, setIsAdding] = useState(false);

    const filteredJobs = useMemo(() => {
        if (!search.trim()) return jobs;

        const query = search.toLowerCase();
        return jobs.filter((job) =>
            [
                job.job_title,
                job.company_name,
                job.location,
                job.status,
                job.remarks,
                job.offer_status
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [jobs, search]);

    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));

    const paginatedJobs = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredJobs.slice(start, start + pageSize);
    }, [filteredJobs, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, pageSize]);

    const columnDefs = [
        {
            field: "job_title",
            headerName: "Job Title",
            editable: true,
            minWidth: 180,
            pinned: "left",
            lockPinned: true,
            cellStyle: { fontWeight: 500 }
        },
        { field: "company_name", headerName: "Company", editable: true, minWidth: 180 },
        { field: "location", headerName: "Location", editable: true, minWidth: 140 },
        {
            field: "applied_date",
            headerName: "Applied Date",
            editable: true,
            minWidth: 140,
            valueFormatter: (params) => formatDateValue(params.value)
        },
        { field: "salary", headerName: "Salary", editable: true, minWidth: 110 },
        {
            field: "status",
            headerName: "Status",
            editable: true,
            minWidth: 150,
            cellEditor: "agSelectCellEditor",
            cellEditorParams: { values: STATUS_OPTIONS },
            cellClassRules: {
                "status-applied": (params) => params.value === "Applied",
                "status-interviewing": (params) => params.value === "Interviewing",
                "status-offered": (params) => params.value === "Offered",
                "status-accepted": (params) => params.value === "Accepted",
                "status-rejected": (params) => params.value === "Rejected",
                "status-withdrawn": (params) => params.value === "Withdrawn"
            }
        },
        { field: "current_round", headerName: "Current Round", editable: true, minWidth: 120 },
        {
            field: "interview_date",
            headerName: "Interview Date",
            editable: true,
            minWidth: 170,
            valueFormatter: (params) => formatDateValue(params.value)
        },
        {
            field: "offer_status",
            headerName: "Offer Status",
            editable: true,
            minWidth: 140,
            cellEditor: "agSelectCellEditor",
            cellEditorParams: { values: OFFER_STATUS_OPTIONS },
            cellClassRules: {
                "offer-none": (params) => params.value === "None",
                "offer-offered": (params) => params.value === "Offered",
                "offer-accepted": (params) => params.value === "Accepted",
                "offer-rejected": (params) => params.value === "Rejected"
            }
        },
        { field: "remarks", headerName: "Remarks", editable: true, minWidth: 220 },
        {
            field: "actions",
            headerName: "Actions",
            suppressMenu: true,
            width: 120,
            cellRenderer: (params) => (
                <button
                    type="button"
                    className="delete-row-btn"
                    onClick={() => deleteJob(params.data.id)}
                >
                    Delete
                </button>
            )
        }
    ];

    async function fetchJobs() {
        const token = localStorage.getItem("access_token");

        if (!token) {
            onLogout?.();
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/jobs/?limit=200`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to fetch jobs");
            }

            setJobs(data);
        } catch (fetchError) {
            console.error("Error fetching jobs:", fetchError);
            setError(fetchError.message || "Unable to load jobs.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchJobs();
    }, []);

    function handleDraftChange(event) {
        const { name, value } = event.target;
        setDraftJob((current) => ({ ...current, [name]: value }));
    }

    async function addJobInline(event) {
        event.preventDefault();

        const token = localStorage.getItem("access_token");
        setError("");
        setIsAdding(true);

        try {
            const payload = {
                ...draftJob,
                job_title: draftJob.job_title.trim(),
                company_name: draftJob.company_name.trim(),
                location: draftJob.location.trim(),
                salary: draftJob.salary === "" ? null : Number(draftJob.salary),
                current_round: draftJob.current_round === "" ? null : Number(draftJob.current_round),
                applied_date: draftJob.applied_date || null,
                interview_date: draftJob.interview_date || null,
                offer_status: draftJob.offer_status === "None" ? null : draftJob.offer_status,
                remarks: draftJob.remarks || null
            };

            if (!payload.job_title || !payload.company_name || !payload.location || !payload.applied_date) {
                throw new Error("Job title, company, location, and applied date are required.");
            }

            const response = await fetch(`${API_BASE_URL}/jobs/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Unable to add job");
            }

            setJobs((currentJobs) => [data, ...currentJobs]);
            setDraftJob(EMPTY_JOB);
            setIsAdding(false);
        } catch (createError) {
            console.error("Error creating job:", createError);
            setError(createError.message || "Unable to create job.");
        } finally {
            setIsAdding(false);
        }
    }

    async function updateJob(event) {
        const token = localStorage.getItem("access_token");
        const jobId = event.data.id;
        const field = event.colDef.field;
        let value = event.newValue;

        if (field === "actions") return;

        if (value === "") {
            value = null;
        }

        if ((field === "current_round" || field === "salary") && value !== null && value !== "") {
            value = Number(value);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ [field]: value })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Update failed");
            }

            setJobs((currentJobs) => currentJobs.map((job) => (job.id === jobId ? data : job)));
        } catch (updateError) {
            console.error("Error updating job:", updateError);
            setError(updateError.message || "Unable to update row.");
            setJobs((currentJobs) =>
                currentJobs.map((job) =>
                    job.id === jobId ? { ...job, [field]: event.oldValue } : job
                )
            );
        }
    }

    async function deleteJob(jobId) {
        const token = localStorage.getItem("access_token");

        try {
            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Unable to delete job");
            }

            setJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobId));
        } catch (deleteError) {
            console.error("Error deleting job:", deleteError);
            setError(deleteError.message || "Unable to delete job.");
        }
    }

    const summary = useMemo(() => ({
        total: jobs.length,
        applied: jobs.filter((job) => job.status === "Applied").length,
        interviewing: jobs.filter((job) => job.status === "Interviewing").length,
        offered: jobs.filter((job) => job.status === "Offered").length,
        accepted: jobs.filter((job) => job.status === "Accepted").length
    }), [jobs]);

    return (
        <div className="job-page">
            <header className="page-header">
                <div>
                    <p className="section-label">Overview</p>
                    <h1>Your Job Applications</h1>
                    <p className="subtitle">Track your job application progress and update each step as you move forward.</p>
                </div>

                <button type="button" className="primary-button" onClick={() => window.location.reload()}>
                    Add Application
                </button>
            </header>

            <div className="summary-row">
                <div className="summary-card">
                    <span>Total</span>
                    <strong>{summary.total}</strong>
                </div>
                <div className="summary-card">
                    <span>Applied</span>
                    <strong>{summary.applied}</strong>
                </div>
                <div className="summary-card">
                    <span>Interviewing</span>
                    <strong>{summary.interviewing}</strong>
                </div>
                <div className="summary-card">
                    <span>Offered</span>
                    <strong>{summary.offered}</strong>
                </div>
                <div className="summary-card">
                    <span>Accepted</span>
                    <strong>{summary.accepted}</strong>
                </div>
            </div>

            <div className="table-toolbar">
                <div className="search-wrap">
                    <label htmlFor="job-search">Search</label>
                    <input
                        id="job-search"
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search jobs..."
                    />
                </div>

                <select
                    className="page-size-select"
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                >
                    <option value={8}>8 per page</option>
                    <option value={12}>12 per page</option>
                    <option value={20}>20 per page</option>
                </select>
            </div>

            <form className="inline-add-form" onSubmit={addJobInline}>
                <input name="job_title" value={draftJob.job_title} onChange={handleDraftChange} placeholder="Job title" />
                <input name="company_name" value={draftJob.company_name} onChange={handleDraftChange} placeholder="Company" />
                <input name="location" value={draftJob.location} onChange={handleDraftChange} placeholder="Location" />
                <input type="date" name="applied_date" value={draftJob.applied_date} onChange={handleDraftChange} />
                <input type="number" name="salary" value={draftJob.salary} onChange={handleDraftChange} placeholder="Salary" />
                <select name="status" value={draftJob.status} onChange={handleDraftChange}>
                    {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
                <input type="number" name="current_round" value={draftJob.current_round} onChange={handleDraftChange} placeholder="Round" />
                <input type="datetime-local" name="interview_date" value={draftJob.interview_date} onChange={handleDraftChange} />
                <select name="offer_status" value={draftJob.offer_status} onChange={handleDraftChange}>
                    {OFFER_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
                <input name="remarks" value={draftJob.remarks} onChange={handleDraftChange} placeholder="Remarks" />
                <button type="submit" className="primary-button inline-add-btn" disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add row"}
                </button>
            </form>

            {error ? <div className="error-banner">{error}</div> : null}

            <div className="sheet-card">
                <div className="sheet-table-wrap">
                    <AgGridReact
                        theme={themeQuartz}
                        rowData={paginatedJobs}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            resizable: true,
                            sortable: true,
                            filter: true,
                            editable: true,
                            minWidth: 100,
                            suppressCellFocus: false,
                            flex: 1
                        }}
                        pagination={false}
                        onCellValueChanged={updateJob}
                        domLayout="autoHeight"
                    />
                </div>

                <div className="pagination-row">
                    <span>
                        Showing {(filteredJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1)}-
                        {Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length}
                    </span>

                    <div className="pagination-controls">
                        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                            Prev
                        </button>
                        <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JobList;