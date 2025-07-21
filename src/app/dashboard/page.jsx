"use client";
import Sidebar from "@/components/Sidebar";
import { auth } from "@/utils/firebase";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  createEvent,
  deleteEvent,
  fetchEventsBySociety,
  // fetchUpcomingEvents, // Assuming a function to fetch upcoming events
  // fetchExecomMembers, // Assuming a function to fetch execom members
  getSociety,
  createYear,
} from "../../utils/FirebaseFunctions";

const Container = styled.div`
  display: flex;
  height: 100vh;
  flex-direction: column;
  background-color: #fffaf0;  // was gradient, now warm neutral

  @media (min-width: 769px) {
    flex-direction: row;
  }
`;


const Content = styled.div`
  flex: 1;
  padding: 20px;
  background-color: #fffaf0;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: linear-gradient(to right, #f97316, #facc15);
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const WelcomeText = styled.h1`
  font-size: 1.2rem;
  font-weight: 700;
  color: white;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const SignOutButton = styled.button`
  background-color: transparent;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.2s;

  &:hover {
    color: #ffe082;
  }
`;

const CreateButton = styled.button`
  background-color: #f97316;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  margin-left: 10px;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: background-color 0.2s, transform 0.1s;

  &:hover {
    background-color: #fb923c;
    transform: scale(1.02);
  }
`;

const DeleteButton = styled.button`
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f87171;
  }
`;

const EventsHeader = styled.h2`
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: #f97316;
  font-weight: 600;
`;

const EventCard = styled.div`
  border: 1px solid #e5e7eb;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  min-height: 8rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const DateBox = styled.div`
  background: linear-gradient(to bottom, #f97316, #facc15);
  color: white;
  padding: 10px;
  text-align: center;
  width: 60px;
  float: left;
  margin-right: 20px;
  border-radius: 5px;

  @media (max-width: 480px) {
    float: none;
    margin: 0 auto 10px;
  }
`;

const Day = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
`;

const Month = styled.div`
  font-size: 0.8rem;
  text-transform: uppercase;
`;

const Year = styled.div`
  font-size: 0.8rem;
`;

const EventTitle = styled.h3`
  margin-top: 0;
  background: linear-gradient(to right, #f97316, #facc15);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;

  @media (max-width: 480px) {
    text-align: center;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  width: 90%;
  max-width: 500px;
  z-index: 1001;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #fcd34d;
  border-radius: 5px;
  background-color: #fffaf0;

  &:focus {
    outline: none;
    border-color: #f97316;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #fcd34d;
  border-radius: 5px;
  background-color: #fffaf0;

  &:focus {
    outline: none;
    border-color: #f97316;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
  }
`;



const Dashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSubview, setActiveSubview] = useState('events'); // Default to events

  const [Society, setSociety] = useState("");

  const [Events, setEvents] = useState([]);
  // State for upcoming events and execom members would be added here
  // const [upcomingEvents, setUpcomingEvents] = useState([]);
  // const [execomMembers, setExecomMembers] = useState([]);

  useEffect(() => {
    document.title = "Manage Events | IEDC Sahrdaya"
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        return router.push("/signin");
      }
       // Determine active subview from URL or state
       const subview = searchParams.get('view') || 'events';
       setActiveSubview(subview);
      const society = await getSociety(user.uid);
      setSociety(society);
      setNewEvent({ ...newEvent, society: society });
      fetchEventsBySociety(society, setEvents);
    });
  }, [setEvents]);
  const [showModal, setShowModal] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    society: "",
  });
  const [Poster, setPoster] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreateEvent = () => {
    
    if (
      !newEvent.title ||
      !newEvent.description ||
      !newEvent.date ||
      !newEvent.society ||
      !Poster
    ) {
      setErrorMessage("All fields are required, including the poster.");
      return;
    }
    createEvent(newEvent, Poster);
    setShowModal(false);
    setNewEvent({ title: "", description: "", date: "", society:"" });
    setPoster(null);
    setNewEvent({ ...newEvent, society: Society });
    setErrorMessage("");
  };
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      await deleteEvent(eventId);
      fetchEventsBySociety(Society, setEvents);
    }
  };
  return (
    <Container>
      <Sidebar society={Society}/>
      <div style={{ flex: 1 }}>
        <Header>
          <WelcomeText>
            Welcome, {Society.toUpperCase()} Execom member of IEDC SAHRDAYA
          </WelcomeText>
          <SignOutButton
            onClick={() => {
              // Optionally, you could clear the active subview here as well
              // and redirect to the base dashboard URL
              // setActiveSubview('events'); 
              // router.push('/dashboard');

              auth.signOut();
            }}
          >
            Sign Out
          </SignOutButton>
        </Header>
        <Content>
         {activeSubview === 'events' && (
            <>
               <CreateButton onClick={() => setShowModal(true)}>
                Create New Event
              </CreateButton>
              <EventsHeader>
                Events Posted by the Club ({Events.length})
              </EventsHeader>
              {Events.map((event) => (
                <EventCard key={event.id}>
                  <DateBox>
                    <Day>{new Date(event.date).getDate()}</Day>
                    <Month>
                      {new Date(event.date).toLocaleString("default", {
                        month: "short",
                      })}
                    </Month>
                    <Year>{new Date(event.date).getFullYear()}</Year>
                  </DateBox>
                  <EventTitle>{event.title}</EventTitle>
                  <p className="truncate-paragraph">{event.description}</p>
                  <DeleteButton onClick={() => handleDeleteEvent(event.id)}>
                    Delete
                  </DeleteButton>
                </EventCard>
              ))}
            </>
          )}

          {/* Placeholder for Upcoming Events Content */}
          {activeSubview === 'upcoming' && (
            <div>
              {/* You will render the UpcomingEventsDashboard component here */}
              <h2>Upcoming Events Content</h2>
              {/* <UpcomingEventsDashboard /> */}
            </div>
          )}

          {/* Placeholder for Execom Content */}
          {activeSubview === 'execom' && (
            <div>
              <h2>Execom Content</h2>
            </div>
          )}

          {/* Past Execom Dashboard Content */}
          {activeSubview === 'past-execom' && (
            <div>
              <h2>Past Execom Dashboard Content</h2>
              {/* You will render the PastExecomDashboard component here */}
            </div>
          )}
        </Content>
      </div>
      {showModal && (
        <Overlay>
          <Modal>
            <h2 className="text-xl font-bold text-center text-[#0682DB]">
              Create New Event
            </h2>
            {errorMessage && (
              <p style={{ color: "red", marginBottom: "10px" }}>
                {errorMessage}
              </p>
            )}
            <Input
              placeholder="Event Title"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
            />
            <Textarea
              placeholder="Event Description"
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
            />
            <Input
              type="date"
              value={newEvent.date}
              onChange={(e) =>
                setNewEvent({ ...newEvent, date: e.target.value })
              }
            />
            <Input type="file" onChange={(e) => setPoster(e.target.files[0])} />
            <CreateButton onClick={handleCreateEvent}>
              Create Event
            </CreateButton>
            <CreateButton onClick={() => setShowModal(false)}>
              Cancel
            </CreateButton>
          </Modal>
        </Overlay>
      )}
    </Container>
  );
};

export default Dashboard;
