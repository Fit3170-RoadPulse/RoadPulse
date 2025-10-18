import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SettingMenu from "../menu/SettingMenu";
import CloseIcon from "../../../components/close.png";
import "./ChangePassword.css";

export default function ChangePassword() {
  const [values, setValues] = useState({ current: "", newPass: "", repeat: "" });
  const [show, setShow] = useState({ current: false, newPass: false, repeat: false });
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setValues(v => ({ ...v, [e.target.name]: e.target.value }));
  const toggle = (field) => setShow(s => ({ ...s, [field]: !s[field] }));

  const validate = () => {
    if (!values.current || !values.newPass || !values.repeat) return "Please fill in all fields.";
    if (values.newPass.length < 8) return "New password must be at least 8 characters long.";
    if (values.newPass !== values.repeat) return "The two new password entries do not match.";
    if (values.current === values.newPass) return "New password cannot be the same as the current password.";
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }
    setMsg({ type: "success", text: "New password has been updated." });
    setValues({ current: "", newPass: "", repeat: "" });
  };

  return (
    <div className="change-password-root">
      {/* <button
        className="close-btn"
        aria-label="Close"
        onClick={() => navigate("/setting-menu-page")}
        title="Back to settings"
        type="button"
      >
        ✕
      </button> */}

      <div className="settings-layout">
        <aside className="settings-left-column" aria-hidden={false}>
          <SettingMenu />
        </aside>

        <main className="settings-main-column" role="main">
          <div className="settings-panel change-password-panel" aria-labelledby="change-password-heading">
            <h2 id="change-password-heading">Change password</h2>

            {msg && (
              <div className={`msg ${msg.type === "error" ? "error" : "success"}`} role="alert" aria-live="polite">
                {msg.text}
              </div>
            )}

            <form className="change-password-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="current-password" className="form-label">Current password</label>
                <div className="input-with-action">
                  <input
                    id="current-password"
                    name="current"
                    type={show.current ? "text" : "password"}
                    className="form-input"
                    value={values.current}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => toggle("current")}
                    aria-label="Toggle current password visibility"
                  >
                    {show.current ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="new-password" className="form-label">New password</label>
                <div className="input-with-action">
                  <input
                    id="new-password"
                    name="newPass"
                    type={show.newPass ? "text" : "password"}
                    className="form-input"
                    value={values.newPass}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => toggle("newPass")}
                    aria-label="Toggle new password visibility"
                  >
                    {show.newPass ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="repeat-password" className="form-label">Repeat password</label>
                <div className="input-with-action">
                  <input
                    id="repeat-password"
                    name="repeat"
                    type={show.repeat ? "text" : "password"}
                    className="form-input"
                    value={values.repeat}
                    onChange={handleChange}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => toggle("repeat")}
                    aria-label="Toggle repeat password visibility"
                  >
                    {show.repeat ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <Link to="/setting-menu-page" className="btn outline">Back</Link>
                <button type="submit" className="btn primary">Save</button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
