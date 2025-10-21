import "./ReportComponent.css"

export default function ReportComponent() {
    async function initReport() {
    }

    return (
        <div className="mapholder" style={{ 
            width: '100%', 
            height: '50vh', 
            backgroundColor: "#F4F4F4",
            borderColor:"black",
            borderWidth:"2px",
            borderRadius: "2rem",
            display: "flex",
            justifyContent: "center",
            flexDirection:"column",
            alignItems: "baseline",
            paddingLeft: "2rem",
            paddingRight: "2rem",
            fontSize:"1rem",
            fontWeight:"light",
            color:"#1E1E1E",
            }}>
            <div>
                <h1 style={{
                    fontWeight:"bold",
                    fontSize:"2rem",
                    color:"black",
                    marginBottom:"1rem"
                }}>New Incident Report</h1>
            </div>
            <div style={{
                display: "flex",
                justifyContent: "center",
                flexDirection:"column",
                alignItems: "baseline",
                gap:"1rem",
                width:"100%"
                }}>
                <div style={{
                    display:"flex",
                    justifyContent:"center",
                    flexDirection:"column",
                    gap:"0.2rem",
                    width:"100%"
                }}>
                    <label for="incidentType">Incident Type</label>
                    <select 
                        name="incidentType" 
                        id="incidentType"
                        style = {{
                            width: "100%",
                            backgroundColor: "white"
                        }}>
                        <option value="" disabled selected>Pick a type</option>
                        <option value="mild">Mild</option>
                        <option value="medium">Medium</option>
                        <option value="Severe">Severe</option>
                    </select>
                </div>
                <div style={{
                    display:"flex",
                    justifyContent:"center",
                    flexDirection:"column",
                    width:"100%",
                    gap:"0.2rem"
                }}>
                    <label for="description">Description</label>
                    <textarea  
                    type="text"
                    id="description"
                    name="description"
                    placeholder="Additional Details"
                    style={{
                        backgroundColor:"white",
                        width:"100%",
                    }}
                    required/>
                </div>

                <div style={{
                    display:"flex",
                    justifyContent:"left",
                }}>
                    <button style={{
                        backgroundColor:"black",
                        color:"white",
                        paddingLeft:"1rem",
                        paddingRight:"1rem",
                        paddingTop:"0.3rem",
                        paddingBottom:"0.3rem",
                        fontSize:"1rem",
                        fontWeight:"normal",
                        borderRadius:0
                    }}>Submit</button>
                </div>
            </div>
        </div>
    );
}