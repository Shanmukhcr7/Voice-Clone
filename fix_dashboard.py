import re

with open('frontend/src/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add useSearchParams
if 'useSearchParams' not in content:
    content = content.replace('import { Link } from "react-router-dom";', 'import { Link, useSearchParams } from "react-router-dom";')

# Add useEffect for cashfree verification inside Dashboard component
dashboard_start = content.find('export default function Dashboard() {')
if dashboard_start != -1:
    use_auth_pos = content.find('const { currentUser, userData, logout, token, setUserData } = useAuth();', dashboard_start)
    if use_auth_pos != -1:
        insert_code = """
  const [searchParams, setSearchParams] = useSearchParams();
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (orderId && token && !verifyingPayment) {
      setVerifyingPayment(true);
      axios.post("/api/billing/verify-payment", { order_id: orderId }, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.data.status === "PAID") {
          alert("Payment Successful! Credits added to your account.");
          // refresh user data
          axios.get(`/api/users/me?t=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(u => setUserData(u.data));
        } else {
          alert("Payment is " + res.data.status);
        }
        searchParams.delete("order_id");
        setSearchParams(searchParams);
      }).catch(err => {
        console.error(err);
        alert("Failed to verify payment");
      }).finally(() => {
        setVerifyingPayment(false);
      });
    }
  }, [searchParams, token]);
"""
        end_of_line = content.find('\n', use_auth_pos)
        content = content[:end_of_line+1] + insert_code + content[end_of_line+1:]

with open('frontend/src/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added cashfree verification to Dashboard")
