import { useState } from "react";

const API_BASE_URL = "http://localhost:8000";

const EMPTY_FORM = {
    job_title: "",
    company_name: "",
    job_url: "",
    location: "",
    applied_date: "",
    salary: "",
    status: "Applied",
    current_round: "",
    interview_date: "",
    offer_status: "None",
    remarks: ""
};

function AddJob({ onJobAdded }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        const token = localStorage.getItem("access_token");

        try {
            const payload = {
                ...form,
                salary: form.salary === "" ? null : Number(form.salary),
                current_round: form.current_round === "" ? null : Number(form.current_round),
                applied_date: form.applied_date || null,
                interview_date: form.interview_date || null,
                offer_status: form.offer_status === "None" ? null : form.offer_status,
                remarks: form.remarks || null
            };

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
                throw new Error(data.detail || "Unable to add job.");
            }

            setForm(EMPTY_FORM);
            onJobAdded?.(data);
        } catch (submitError) {
            setError(submitError.message || "Unable to add job");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="panel-card add-job-panel">
            <div className="panel-header-row">
                <div>
                    <p className="panel-kicker">Add</p>
                    <h3>Add Application</h3>
                </div>
            </div>

            <form className="add-job-form" onSubmit={handleSubmit}>
                <div className="field-grid">
                    <label>
                        <span>Job Title</span>
                        <input name="job_title" value={form.job_title} onChange={handleChange} required />
                    </label>

                    <label>
                        <span>Company</span>
                        <input name="company_name" value={form.company_name} onChange={handleChange} required />
                    </label>

                    <label>
                        <span>Location</span>
                        <input name="location" value={form.location} onChange={handleChange} required />
                    </label>

                    <label>
                        <span>Applied Date</span>
                        <input type="date" name="applied_date" value={form.applied_date} onChange={handleChange} required />
                    </label>

                    <label>
                        <span>Salary</span>
                        <input type="number" name="salary" value={form.salary} onChange={handleChange} />
                    </label>

                    <label>
                        <span>Status</span>
                        <select name="status" value={form.status} onChange={handleChange}>
                            <option>Applied</option>
                            <option>Interviewing</option>
                            <option>Offered</option>
                            <option>Accepted</option>
                            <option>Rejected</option>
                            <option>Withdrawn</option>
                        </select>
                    </label>

                    <label>
                        <span>Current Round</span>
                        <input type="number" name="current_round" value={form.current_round} onChange={handleChange} />
                    </label>

                    <label>
                        <span>Interview Date</span>
                        <input type="datetime-local" name="interview_date" value={form.interview_date} onChange={handleChange} />
                    </label>

                    <label>
                        <span>Offer Status</span>
                        <select name="offer_status" value={form.offer_status} onChange={handleChange}>
                            <option>None</option>
                            <option>Offered</option>
                            <option>Accepted</option>
                            <option>Rejected</option>
                        </select>
                    </label>

                    <label className="full-width">
                        <span>Job URL</span>
                        <input name="job_url" value={form.job_url} onChange={handleChange} required />
                    </label>

                    <label className="full-width">
                        <span>Remarks</span>
                        <textarea name="remarks" value={form.remarks} onChange={handleChange} rows="3" />
                    </label>
                </div>

                {error ? <div className="form-error">{error}</div> : null}

                <button type="submit" className="primary-button" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Job"}
                </button>
            </form>
        </div>
    );
}

export default AddJob;
