import { useEffect, useState } from "react"
import axios from "axios"

export default function App() {
  const [showPopup, setShowPopup] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [timer, setTimer] = useState(null)

  const emergencyNumber = "+60143839566"

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || ""
    axios.get(`${base}/api/health/`).then(r => console.log(r.data))
    axios.get(`${base}/api/samples/`).then(r => console.log(r.data))
  }, [])

  const startCountdown = () => {
    setCountdown(5) // reset countdown
    setShowPopup(true)

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setTimer(interval)
  }

  const cancelCall = () => {
    if (timer) clearInterval(timer)
    setShowPopup(false)
    setCountdown(5)
  }

  return (
    <div 
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "flex-start",
        minHeight: "100vh",
        width: "100vw",
        paddingTop: "60px"
      }}
    >
      {/* Emergency Call Button */}
      <button
        style={{
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          backgroundColor: "red",
          color: "white",
          fontSize: "25px",
          fontWeight: "bold",
          border: "none",
          cursor: "pointer",
        }}
        onClick={startCountdown}
      >
        {showPopup && countdown > 0
          ? `⚠️ ${countdown} seconds`
          : "🚨 Emergency\nPress for help"}
      </button>

      {/* Confirmation Popup */}
      {showPopup && (
        <div
          style={{
            marginTop: "20px",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            width: "300px",
            textAlign: "center",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        >
          <h3 style={{ margin: 0, color: "red" }}>⚠️ Emergency Alert</h3>

          {countdown > 0 ? (
            <>
              <p>
                Calling your emergency contact in{" "}
                <span style={{ color: "red", fontWeight: "bold" }}>
                  {countdown} seconds
                </span>
              </p>
              <button
                style={{
                  backgroundColor: "black",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "50px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onClick={cancelCall}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <p>Time is up! Press below to call now:</p>
              <a href={`tel:${emergencyNumber}`}>
                <button
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  📞 Call Now
                </button>
              </a>
              <br />
              <button
                style={{
                  marginTop: "10px",
                  backgroundColor: "black",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={cancelCall}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
