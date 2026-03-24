import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Bell, Calendar, Trash2, Info, Clock, AlertCircle, X, Volume2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Meeting } from './types';
import { cn, formatDateTime, getReminderTime } from './lib/utils';

const COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 
  'bg-emerald-500', 'bg-orange-500', 'bg-indigo-500'
];

export default function App() {
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem('meetings');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [advValue, setAdvValue] = useState(30);
  const [advUnit, setAdvUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on first interaction to bypass browser restrictions
  const playAlarm = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }
    audioRef.current.play().catch(e => {
        console.warn("Audio play failed - browser might be blocking auto-play. Interact with page first.");
        toast.error("Please click anywhere to enable alarm sounds.");
    });
  }, []);

  const testAlarm = () => {
    playAlarm();
    toast.success("Sound test successful!");
  };

  useEffect(() => {
    localStorage.setItem('meetings', JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let updated = false;
      const newMeetings = meetings.map(m => {
        const meetingDate = new Date(m.date);
        const advanceDate = getReminderTime(m.date, m.advanceReminderValue, m.advanceReminderUnit);

        // Advance Reminder
        if (!m.remindedAdvance && now >= advanceDate && now < meetingDate) {
          toast.info(
            <div className="flex flex-col">
              <span className="font-bold">የስብሰባ ማስታወሻ (Reminder)</span>
              <span>{m.title} በ {m.advanceReminderValue} {m.advanceReminderUnit === 'minutes' ? 'ደቂቃ' : m.advanceReminderUnit === 'hours' ? 'ሰዓት' : 'ቀን'} ውስጥ ይጀምራል!</span>
            </div>,
            { duration: 10000, icon: <Bell className="w-5 h-5 text-blue-500" /> }
          );
          playAlarm();
          updated = true;
          return { ...m, remindedAdvance: true };
        }

        // Actual Meeting Time Reminder
        if (!m.remindedActual && now >= meetingDate) {
          toast.success(
            <div className="flex flex-col">
              <span className="font-bold text-lg">ስብሰባው ደርሷል! (Meeting Time)</span>
              <span>{m.title} አሁን እየተካሄደ ነው።</span>
            </div>,
            { 
              duration: 20000, 
              icon: <AlertCircle className="w-6 h-6 text-white" />,
              className: 'bg-indigo-600 text-white border-none shadow-2xl scale-110',
            }
          );
          playAlarm();
          updated = true;
          return { ...m, remindedActual: true };
        }

        return m;
      });

      if (updated) {
        setMeetings(newMeetings);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [meetings, playAlarm]);

  const addMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const newMeeting: Meeting = {
      id: crypto.randomUUID(),
      title,
      description,
      date,
      advanceReminderValue: advValue,
      advanceReminderUnit: advUnit,
      remindedAdvance: false,
      remindedActual: false,
      createdAt: new Date().toISOString(),
      color: selectedColor,
    };

    setMeetings([newMeeting, ...meetings]);
    setIsAdding(false);
    resetForm();
    toast.success('ስብሰባው በተሳካ ሁኔታ ተመዝግቧል (Meeting saved)');
  };

  const deleteMeeting = (id: string) => {
    setMeetings(meetings.filter(m => m.id !== id));
    toast.error('ተሰርዟል (Deleted)');
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setAdvValue(30);
    setAdvUnit('minutes');
    setSelectedColor(COLORS[0]);
  };

  return (
    <div 
      className="min-h-screen font-sans text-slate-900 bg-cover bg-center bg-fixed transition-all duration-500 selection:bg-indigo-100"
      style={{ backgroundImage: `url('https://storage.googleapis.com/dala-prod-public-storage/generated-images/686aad66-7a55-4271-87e0-9f99c1eeac7e/app-background-1c86abef-1774379852704.webp')` }}
    >
      <div className="min-h-screen backdrop-blur-[2px] bg-black/20 px-4 py-8 md:p-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-2xl">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                የስብሰባ ማስታወሻ
              </h1>
              <p className="text-white/90 mt-2 text-lg font-medium">Meeting & Appointment Manager</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={testAlarm}
                className="flex-1 md:flex-none bg-white/20 hover:bg-white/30 text-white p-4 rounded-2xl transition-all border border-white/10"
                title="Test Alarm Sound"
              >
                <Volume2 className="w-6 h-6 mx-auto" />
              </button>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex-[3] md:flex-none bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-4 rounded-2xl font-bold shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-6 h-6" />
                አዲስ ጨምር (Add New)
              </button>
            </div>
          </header>

          {/* Meeting List */}
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {meetings.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-full py-24 text-center bg-white/10 backdrop-blur-md rounded-[3rem] border border-white/20 shadow-inner"
                >
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-12 h-12 text-white/60" />
                  </div>
                  <p className="text-white text-2xl font-bold">ምንም የተመዘገበ ነገር የለም</p>
                  <p className="text-white/60 mt-2">No meetings scheduled yet.</p>
                </motion.div>
              ) : (
                meetings.map((meeting) => (
                  <motion.div
                    key={meeting.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative bg-white/95 backdrop-blur-lg rounded-[2.5rem] p-7 shadow-xl border border-white/40 hover:shadow-2xl transition-all cursor-pointer overflow-hidden flex flex-col"
                    onClick={() => setSelectedMeeting(meeting)}
                  >
                    <div className={cn("absolute top-0 left-0 w-3 h-full", meeting.color)} />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-4">
                        <h3 className="text-2xl font-extrabold text-slate-800 line-clamp-1 leading-tight">{meeting.title}</h3>
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mt-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateTime(meeting.date)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMeeting(meeting.id);
                        }}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>

                    <p className="text-slate-600 line-clamp-2 text-sm mb-6 flex-grow leading-relaxed">
                      {meeting.description || 'ዝርዝር መረጃ አልተገለጸም (No description)'}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <Bell className="w-3 h-3" />
                        <span>{meeting.advanceReminderValue} {meeting.advanceReminderUnit} before</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-sm group-hover:translate-x-1 transition-transform">
                        <span>ዝርዝር (Details)</span>
                        <Info className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={addMeeting} className="p-8 md:p-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black text-slate-900">አዲስ ስብሰባ (Add)</h2>
                  <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">ርዕስ (Title)</label>
                    <input 
                      required
                      type="text"
                      placeholder="የስብሰባው ርዕስ..."
                      className="w-full bg-slate-100 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 focus:ring-0 transition-all text-slate-800 text-lg font-semibold"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">ቀን እና ሰዓት (Date)</label>
                      <input 
                        required
                        type="datetime-local"
                        className="w-full bg-slate-100 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 focus:ring-0 transition-all text-slate-800 font-semibold"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="col-span-2">
                          <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">ማስታወሻ ከስንት ጊዜ በፊት? (Remind Before)</label>
                       </div>
                       <input 
                        type="number"
                        min="1"
                        className="w-full bg-slate-100 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 focus:ring-0 transition-all text-slate-800 font-bold"
                        value={advValue}
                        onChange={(e) => setAdvValue(parseInt(e.target.value))}
                      />
                      <select 
                        className="w-full bg-slate-100 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-4 py-4 focus:ring-0 transition-all text-slate-800 font-bold"
                        value={advUnit}
                        onChange={(e) => setAdvUnit(e.target.value as any)}
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">ዝርዝር መረጃ (Description)</label>
                    <textarea 
                      rows={4}
                      placeholder="ስለ ስብሰባው ዝርዝር መረጃ እዚህ ይጻፉ..."
                      className="w-full bg-slate-100 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 focus:ring-0 transition-all text-slate-800 resize-none font-medium"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-3 ml-1">መለያ ከለር (Theme)</label>
                    <div className="flex gap-4">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={cn(
                            "w-10 h-10 rounded-full transition-all transform hover:scale-125 shadow-md",
                            c,
                            selectedColor === c ? "ring-4 ring-offset-2 ring-indigo-500 scale-125" : ""
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-10">
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white px-8 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:translate-y-0"
                  >
                    መዝግብ (Save)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMeeting(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className={cn("h-6", selectedMeeting.color)} />
              <div className="p-8 md:p-12">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-4 rounded-2xl text-white shadow-lg", selectedMeeting.color)}>
                      <Calendar className="w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedMeeting.title}</h2>
                  </div>
                  <button onClick={() => setSelectedMeeting(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <Clock className="w-6 h-6 text-indigo-500 mt-1" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">ቀን እና ሰዓት</p>
                        <p className="text-lg font-bold text-slate-800">{formatDateTime(selectedMeeting.date)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <Bell className="w-6 h-6 text-indigo-500 mt-1" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">ማስታወሻ (Reminder)</p>
                        <p className="text-lg font-bold text-slate-800">
                          {selectedMeeting.advanceReminderValue} {selectedMeeting.advanceReminderUnit} before
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3">ዝርዝር መረጃ (Description)</p>
                    <div className="bg-slate-50 rounded-[2rem] p-8 min-h-[160px] border border-slate-100">
                      <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
                        {selectedMeeting.description || 'ምንም ተጨማሪ መረጃ የለም (No additional information).'}
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedMeeting(null)}
                  className="w-full mt-10 bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-lg hover:bg-slate-800 transition-all shadow-2xl active:scale-95"
                >
                  ተመለስ (Close)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toaster position="top-right" expand={true} richColors theme="light" />
    </div>
  );
}