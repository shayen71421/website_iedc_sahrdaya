"use client";

import Navbar from "@/components/Navbar/Navbar";
import AboutSection from "@/sections/HomePage/AboutSection";
import ExecomSection from "@/sections/HomePage/ExecomSection";
import FooterSection from "@/sections/HomePage/FooterSection";
import HeroSection from "@/sections/HomePage/HeroSection";
import InformantSection from "@/sections/HomePage/InformantSection";
import LatestEventSection from "@/sections/HomePage/LatestEventSection";
import Societies from "@/sections/HomePage/Societies";
import UpcomingEventsSection from "@/sections/HomePage/UpcomingEventsSection";
import {
  fetchAllEvents,
  fetchPeopleBySociety,
} from "@/utils/FirebaseFunctions";
import { useEffect, useState } from "react";
import { AboutSectionData } from "./data";
import { db } from "@/utils/firebase";
import { doc, getDoc } from "firebase/firestore";

const Home = () => {
  const [aboutsectionData, setAboutSectionData] = useState(AboutSectionData);
  const [latestsectionData, setLatestSectionData] = useState([]);
  const [ExecomData, setExecomData] = useState([]);
  useEffect(() => {
    document.title = "IEDC Sahrdaya"
    fetchAllEvents(setLatestSectionData);
    fetchPeopleBySociety("Main", setExecomData);
  }, []);
  
  return (
    <div>
      <Navbar />
      <div className="">
        <HeroSection />
        <AboutSection
          title={aboutsectionData.title}
          textContent={aboutsectionData.textContent}
          imageSrc={aboutsectionData.imageSrc}
        />
        <InformantSection />
        <FooterSection />
      </div>
    </div>
  );
};

export default Home;
