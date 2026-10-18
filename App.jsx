import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Rooms from './pages/Rooms.jsx';
import Facilities from './pages/Facilities.jsx';
import Food from './pages/Food.jsx';
import Booking from './pages/Booking.jsx';
import Location from './pages/Location.jsx';
import Contact from './pages/Contact.jsx';
import Pay from './pages/Pay.jsx';
import AdminPage from './pages/admin/AdminPage.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      {/* Admin sits outside the public layout. Access is enforced by Supabase RLS, not by hiding this route. */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/pay/:token" element={<Layout><Pay /></Layout>} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="facilities" element={<Facilities />} />
        <Route path="food" element={<Food />} />
        <Route path="book" element={<Booking />} />
        <Route path="location" element={<Location />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
