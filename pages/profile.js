import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { withAuthSync } from "../utils/auth";
import { fetcher } from "../utils/network";
import Layout from "../components/layout";

const PROFILE_API = "/api/profile";
const TRANSIT_API = "/api/transit/lines";

const Profile = () => {
  const router = useRouter();
  // This is the transit lines fetched from 511.org
  const [transitLines, setTransitLines] = useState([]);
  // Contains all the user data - id, email, phone, lines, smsStatus
  const [userData, setUserData] = useState({});
  const [userError, setUserError] = useState();
  const [toastData, setToast] = useState({ isOpen: false });

  useEffect(async () => {
    let user;
    let transitData;
    try {
      user = await fetcher()(PROFILE_API);
      transitData = await fetcher()(TRANSIT_API);
      // Set the error object returned by the server if it exists
      if (user.error || transitData.error) {
        setUserError({ ...user });
      }
    } catch (err) {
      setUserError(err);
    }
    // TODO(@jlevyd15) this is potentially a security risk, rework this
    const parsedTransitData = eval(transitData.data);
    const {
      userId,
      phoneNumber: userPhone,
      email: userEmail,
      lines: userLines,
      smsStatus,
    } = user.data;
    setUserData({
      userId,
      userPhone,
      userEmail,
      userLines,
      smsStatus,
    });
    setTransitLines(parsedTransitData);
  }, []);

  useEffect(() => {
    if (userError) router.push("/");
  }, [userError, router]);

  useEffect(() => {
    const { isOpen } = toastData;
    if (isOpen) {
      setTimeout(() => {
        setToast({ isOpen: false });
      }, 3 * 1000); // 3 seconds
    }
  }, [toastData.isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (window) {
      window.scrollTo(0, 0);
    }

    const {
      userId: id,
      userPhone: phoneNumber,
      userLines: lines,
      smsStatus,
    } = userData;
    // submit the new data to the server using the user id
    const postData = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        phoneNumber,
        lines,
        smsStatus,
      }),
    };
    // const response = await useSWR("/api/profile", fetcher(postData));
    // Show a visual confirmation after the data is saved
    try {
      await fetcher(postData)(PROFILE_API);
      setToast({ isOpen: true, message: "Profile settings updated!" });
    } catch (err) {
      setToast({ isOpen: true, message: err.message });
    }
  };

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    const value = e.target.id;
    if (isChecked && !userData.userLines.includes(value)) {
      setUserData({ ...userData, userLines: [...userData.userLines, value] });
    } else {
      setUserData({
        ...userData,
        userLines: userData.userLines.filter((line) => line !== value),
      });
    }
  };

  const handleUpdatePhoneNumber = (e) => {
    // TODO(@jlevyd15) Validate this data
    const userPhone = e.target.value;
    setUserData({ ...userData, userPhone });
  };

  if (userError) {
    return (
      <div>
        Something went wrong, please refresh the page. <br />{" "}
        {userError.message}
      </div>
    );
  }

  return (
    <Layout>
      <h1>Profile settings</h1>
      {toastData.isOpen && <h2>{toastData.message}</h2>}

      {!userData.userEmail || transitLines.length < 1 ? (
        <h1>Loading...</h1>
      ) : (
        <>
          <h1>Hello {userData.userEmail}</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="smsStatus">
                <input
                  id="smsStatus"
                  type="checkbox"
                  onChange={() =>
                    setUserData({ ...userData, smsStatus: !userData.smsStatus })
                  }
                  checked={!!userData.smsStatus}
                />
                Send Transit times via SMS
              </label>
            </div>
            <div>
              <label htmlFor="phoneNumber">
                Phone number:
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  required
                  type="number"
                  onChange={handleUpdatePhoneNumber}
                  value={userData.userPhone}
                />
              </label>
            </div>
            <div>
              <fieldset>
                <legend>Choose transit lines</legend>
                {transitLines.map((line) => {
                  return (
                    <div>
                      <input
                        type="checkbox"
                        id={line.Id}
                        name="lines"
                        value={line.Id}
                        onChange={handleCheckboxChange}
                        checked={userData.userLines?.includes(line.Id)}
                      />
                      <label for={line.Id}>
                        <b>{line.Id}</b>
                        {` - ${line.Name}`}
                      </label>
                    </div>
                  );
                })}
              </fieldset>
            </div>
            <button type="submit">Save</button>
          </form>
        </>
      )}
    </Layout>
  );
};

export default withAuthSync(Profile);
