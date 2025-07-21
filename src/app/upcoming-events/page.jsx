"use client";

import { useState, useEffect, Fragment } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import styled from "styled-components";
import { Dialog, Transition } from '@headlessui/react';
import { getUpcomingEvents, getUpcomingEventById } from "@/utils/FirebaseFunctions";
import Navbar from "@/components/Navbar/Navbar";
import { IoClose } from "react-icons/io5";
import { useSearchParams, useRouter } from 'next/navigation';

const EventsContainer = styled.div`
  width: 90%;
  max-width: 1200px;
  margin: auto;
  padding: 2rem 0;
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 2rem;
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const EventCardWrapper = styled(motion.div)`
  border-radius: 16px;
  overflow: hidden;
  background: #fffaf0;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.1);
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(249, 115, 22, 0.2);
  }
`;

const Modal = styled(Dialog)`
  position: fixed;
  z-index: 50;
  inset: 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
`;

const ModalContent = styled.div`
  position: relative;
  background: #fffaf0;
  border-radius: 16px;
  max-width: 1000px;
  width: 90%;
  margin: 2rem auto;
  padding: 2rem;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(249, 115, 22, 0.2);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  color: #78350f;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 50;
  &:hover {
    color: #7c2d12;
    transform: rotate(90deg);
  }
`;

const EventTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #f97316, #facc15);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  line-height: 1.3;
  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const EventDescription = styled.p`
  font-size: 1rem;
  line-height: 1.7;
  color: #78350f;
  white-space: pre-wrap;
  text-align: justify;
`;

const EventMetadata = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #92400e;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  img {
    width: 100%;
    height: auto;
    object-fit: contain;
    border-radius: 12px;
  }
`;

const ViewDetailsButton = styled.button`
  background: linear-gradient(to right, #f97316, #facc15);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
  width: 100%;
  &:hover {
    background: linear-gradient(to right, #ea580c, #eab308);
    box-shadow: 0 4px 10px rgba(249, 115, 22, 0.3);
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
`;

const SOCIETIES_MAP = [
  { code: "cod", name: "Coders Club" },
  { code: "hdw", name: "Hardware Club" },
  { code: "Main", name: "Main Society" }, // Added Main Society
];

function EventCard({ event, index, inView, onCardClick }) {
  const societyInfo = SOCIETIES_MAP.find(s => s.code === event.society);
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  return (
    <EventCardWrapper
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="aspect-video relative">
        <img src={event.mediaPath} alt={event.title} className="absolute w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h2 className="font-bold text-xl mb-2 text-orange-700">{event.title}</h2>
        <p className="text-sm text-orange-500 mb-2">{formattedDate}</p>
        <p className="text-sm text-orange-600 mb-3">{societyInfo ? societyInfo.name : event.society}</p>
        <ViewDetailsButton onClick={() => onCardClick(event)}>View Details</ViewDetailsButton>
      </div>
    </EventCardWrapper>
  );
}

function UpcomingEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchAndSetEvents = async () => {
      setLoading(true);
      try {
        const eventId = searchParams.get('event');
        if (eventId) {
          // Fetch specific event if ID is in URL
          const event = await getUpcomingEventById(eventId);
          if (event) {
            setEvents([event]); // Set events as an array with the single event
            setSelectedEvent(event); // Open the modal
          } else {
            // If event not found, clear the query parameter and fetch all events
            router.push('/upcoming-events', undefined, { shallow: true });
            const allEvents = await getUpcomingEvents();
            setEvents(allEvents);
          }
        } else {
          // Fetch all events if no ID is in URL
          const allEvents = await getUpcomingEvents();
          setEvents(allEvents);
        }
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
      } finally { setLoading(false); } };fetchAndSetEvents();
  }, []);

  const handleCardClick = (event) => {
    setSelectedEvent(event);
    // Update URL to include event ID as a query parameter
    router.push(`/upcoming-events?event=${event.id}`, undefined, { shallow: true });
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    router.push('/upcoming-events', undefined, { shallow: true });
  };

  return (
    <>
      <Navbar />
      <EventsContainer>
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-center mb-8"
          style={{
            background: 'linear-gradient(to right, #f97316, #facc15)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Upcoming Events
        </motion.h1>

        <EventsGrid ref={ref}>
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              inView={inView}
              onCardClick={handleCardClick}
            />
          ))}
        </EventsGrid>

        <Transition show={selectedEvent !== null} as={Fragment}>
          <Modal onClose={handleCloseModal}>
            <Transition.Child
              as="div"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ModalOverlay />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child // This was the second Fragment, now a div
 as="div" enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  {selectedEvent && (
                    <ModalContent>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b-2 border-orange-200 pb-4">
                          <EventTitle>{selectedEvent.title}</EventTitle>
                          <CloseButton onClick={handleCloseModal}>
                            <IoClose size={28} />
                          </CloseButton>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                          <ImageContainer>
                            <img
                              src={selectedEvent.mediaPath}
                              alt={selectedEvent.title}
                              loading="lazy"
                              style={{
                                borderRadius: '12px',
                                boxShadow: '0 6px 20px rgba(249, 115, 22, 0.2)',
                                border: '3px solid #fed7aa',
                              }}
                            />
                          </ImageContainer>

                          <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                          >
                            <div className="space-y-4">
                              <EventMetadata>
                                <span style={{ background: 'linear-gradient(to right, #f97316, #facc15)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>📅</span>
                                <span>{new Date(selectedEvent.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </EventMetadata>
                              <EventMetadata>
                                <span style={{ background: 'linear-gradient(to right, #f97316, #facc15)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🏛️</span>
                                <span>{selectedEvent.Society}</span>

                              </EventMetadata>
                              <hr style={{ borderTop: '2px dashed #f97316', margin: '1rem 0' }} />
                              <div className="pt-2">
                                <h3 className="text-sm font-semibold text-orange-500 mb-2">About the Event</h3>
                                <EventDescription>{selectedEvent.description}</EventDescription>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-6">
                              {selectedEvent.mode === "Offline" && selectedEvent.venue && (
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.venue)}`} target="_blank" rel="noopener noreferrer"
                                   className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-orange-500 text-orange-600 font-semibold hover:bg-orange-50 transition-all">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin mr-2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                  View Venue
                                </a>
                              )}
                              {selectedEvent.needReg === "True" && selectedEvent.regLink && (
                                <a href={selectedEvent.regLink} target="_blank" rel="noopener noreferrer"
                                   className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold shadow hover:shadow-lg hover:from-orange-600 hover:to-yellow-600 transition-all">
                                  Register Here
                                </a>
                              )}
                              {selectedEvent.mode === "Online" && selectedEvent.meetlink && (
                                <a href={selectedEvent.meetlink} target="_blank" rel="noopener noreferrer"
                                   className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-orange-500 text-orange-600 font-semibold hover:bg-orange-50 transition-all">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link-2 mr-2"><path d="M9 17H7a5 5 0 0 1 0-10h2"/><path d="M15 7h2a5 5 0 0 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
                                  Join Meet
                                </a>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </ModalContent>
                  )}
                </Transition.Child>
              </div>
            </div>
          </Modal>
        </Transition>
      </EventsContainer>
    </>
  );
}

export default UpcomingEventsPage;
