
import React, { useState, useEffect } from "react";
import { PayPeriod, Contract, User, ScheduleEvent } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format, parseISO, isValid, addWeeks, addDays, differenceInWeeks, isBefore, isAfter, isSameDay, isWithinInterval } from "date-fns";

export default function Payroll() {
  const [payPeriods, setPayPeriods] = useState([]);
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeContract, setActiveContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const contracts = await Contract.list("-created_date");
      const events = await ScheduleEvent.list("-start_date");
      const activeContract = contracts.find(c => c.is_active);

      let finalPayPeriods = [];
      if (activeContract) {
        // Get all pay periods for this contract
        let allPeriods = await PayPeriod.filter({ contract_id: activeContract.id }, "-start_date");

        // Check if we need to create/update the current pay period
        const currentPeriod = await ensureCurrentPayPeriod(user, activeContract, allPeriods, events);
        if (currentPeriod) {
          // Replace or add the current period to ensure it's at the top and unique in our client-side list
          allPeriods = allPeriods.filter(p => p.id !== currentPeriod.id);
          allPeriods.unshift(currentPeriod); // Add the updated/new one to the front of the list
        }

        // Filter to only include periods within the contract timeframe
        const contractStart = parseISO(activeContract.start_date);
        const contractEnd = activeContract.end_date ? parseISO(activeContract.end_date) : new Date(2100, 11, 31); // Far future date for open-ended contracts

        finalPayPeriods = allPeriods.filter(period => {
          const periodStart = parseISO(period.start_date);
          // Period must start within contract timeframe
          return !isBefore(periodStart, contractStart) && !isAfter(periodStart, contractEnd);
        });

        // Remove duplicates based on start_date - ensures unique display
        const uniquePeriods = [];
        const seenDates = new Set();

        finalPayPeriods.forEach(period => {
          const dateKey = period.start_date;
          if (!seenDates.has(dateKey)) {
            seenDates.add(dateKey);
            uniquePeriods.push(period);
          }
        });

        finalPayPeriods = uniquePeriods;

        // Calculate hours and amounts from schedule events for each period
        // This ensures all displayed periods have up-to-date calculated values based on current events
        finalPayPeriods = finalPayPeriods.map(period => {
          const periodData = calculatePeriodFromEvents(period, events, activeContract);
          return { ...period, ...periodData };
        });
      }

      setCurrentUser(user);
      setActiveContract(activeContract);
      setScheduleEvents(events);
      setPayPeriods(finalPayPeriods);
    } catch (error) {
      console.error("Error loading payroll data:", error);
    }
    setIsLoading(false);
  };

  const ensureCurrentPayPeriod = async (user, activeContract, existingPeriods, events) => {
    // Only proceed if there's an active contract with a start date
    if (!activeContract || !activeContract.start_date) return null;

    const today = new Date();
    const contractStart = parseISO(activeContract.start_date);
    const contractEnd = activeContract.end_date ? parseISO(activeContract.end_date) : new Date(2100, 11, 31);

    // Do not create/update periods if today is outside the contract's timeframe (before start or after end)
    if (isBefore(today, contractStart) || isAfter(today, contractEnd)) {
      return null;
    }

    // Determine the current bi-weekly pay period based on today's date and contract start
    const currentPeriodInfo = getCurrentPayPeriod(today, contractStart);
    if (!currentPeriodInfo) return null; // Should ideally not happen if date logic is solid

    // Check if this specific pay period already exists in the database/fetched list
    const existingPeriod = existingPeriods.find(p => {
      const periodStart = parseISO(p.start_date);
      return isSameDay(periodStart, currentPeriodInfo.start);
    });

    // Calculate the total hours and amount for the current period based on relevant schedule events
    const periodData = calculatePeriodFromEvents({
      start_date: format(currentPeriodInfo.start, 'yyyy-MM-dd'),
      end_date: format(currentPeriodInfo.end, 'yyyy-MM-dd')
    }, events, activeContract);

    let resultPeriod;
    if (existingPeriod) {
      // If the period already exists, update its details in the database
      try {
        const updatedFields = {
          total_hours: periodData.total_hours,
          regular_hours: periodData.regular_hours,
          overtime_hours: periodData.overtime_hours,
          total_amount: periodData.total_amount
        };
        // Update the database record and get the most current state of the object
        const dbUpdatedPeriod = await PayPeriod.update(existingPeriod.id, updatedFields);
        // Combine existing data (like ID) with the DB updated fields and the fresh calculated data
        resultPeriod = { ...existingPeriod, ...dbUpdatedPeriod, ...periodData };
      } catch (error) {
        console.error("Error updating current pay period:", error);
        // Fallback: If DB update fails, return the existing period combined with fresh calculations for display
        resultPeriod = { ...existingPeriod, ...periodData };
      }
    } else {
      // If the period does not exist, create a new one in the database
      try {
        const newPayPeriod = await PayPeriod.create({
          period_title: currentPeriodInfo.title,
          start_date: format(currentPeriodInfo.start, 'yyyy-MM-dd'),
          end_date: format(currentPeriodInfo.end, 'yyyy-MM-dd'),
          total_hours: periodData.total_hours,
          regular_hours: periodData.regular_hours,
          overtime_hours: periodData.overtime_hours,
          // Store the rates used at the time of calculation for historical accuracy
          hourly_rate: activeContract.base_hourly_rate,
          overtime_rate: activeContract.overtime_rate || (activeContract.base_hourly_rate * 1.5),
          total_amount: periodData.total_amount,
          contract_id: activeContract.id,
          is_paid: false // Newly created period is always unpaid
        });
        // Combine the newly created DB record with the fresh calculated data for display
        resultPeriod = { ...newPayPeriod, ...periodData };
      } catch (error) {
        console.error("Error creating current pay period:", error);
        return null; // Return null if creation fails
      }
    }
    return resultPeriod;
  };

  // Helper function to calculate the start, end, and title of the current bi-weekly pay period
  const getCurrentPayPeriod = (today, contractStart) => {
    // Determine the number of full bi-weekly periods that have passed since the contract started.
    // This anchors the bi-weekly periods to the contract's actual start date, not a fixed calendar week.
    const diffWeeks = differenceInWeeks(today, contractStart);
    const biWeeksSinceStart = Math.floor(diffWeeks / 2);

    // Calculate the start date of the current bi-weekly period
    const periodStart = addWeeks(contractStart, biWeeksSinceStart * 2);
    // Calculate the end date (a bi-weekly period is 14 days, so 13 days after the start date)
    const periodEnd = addDays(periodStart, 13);

    return {
      start: periodStart,
      end: periodEnd,
      title: `${format(periodStart, 'MMM d')} - ${format(periodEnd, 'MMM d, yyyy')}`
    };
  };

  const calculatePeriodFromEvents = (period, events, contract) => {
    const periodStart = parseISO(period.start_date);
    const periodEnd = parseISO(period.end_date);

    // Filter for work events that fall within the current pay period
    const workEvents = events.filter(event => {
      // Basic validation for event data
      if (!event || event.type !== 'work' || !event.start_date) return false;

      const eventDate = parseISO(event.start_date);
      // Ensure the parsed date is valid before checking if it's within the interval
      if (!isValid(eventDate)) return false;

      return isWithinInterval(eventDate, { start: periodStart, end: periodEnd });
    });

    let totalHours = 0;

    // Calculate total hours from all relevant work events
    workEvents.forEach(event => {
      const startTime = event.start_time;
      const endTime = event.end_time;

      if (startTime && endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Handle overnight events: if end time is numerically before start time, add 24 hours (1440 minutes) to end time
        const durationMinutes = endMinutes >= startMinutes ? (endMinutes - startMinutes) : (endMinutes + 24 * 60 - startMinutes);
        const eventHours = durationMinutes / 60;

        if (eventHours > 0) {
          totalHours += eventHours;
        }
      }
    });

    // Calculate regular and overtime hours. Assuming a standard bi-weekly regular hours cap (e.g., 80 hours for 2 weeks).
    const biWeeklyRegularHoursCap = 80; // (40 hours/week * 2 weeks)
    const regularHours = Math.min(totalHours, biWeeklyRegularHoursCap);
    const overtimeHours = Math.max(0, totalHours - biWeeklyRegularHoursCap);

    // Calculate payment amounts based on contract rates
    const baseHourlyRate = contract.base_hourly_rate || 0;
    const overtimeRate = contract.overtime_rate || (baseHourlyRate * 1.5) || 0; // Use contract's overtime rate, or 1.5x base rate as default

    const regularPay = regularHours * baseHourlyRate;
    const overtimePay = overtimeHours * overtimeRate;
    const totalAmount = regularPay + overtimePay;

    return {
      total_hours: totalHours,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      total_amount: totalAmount
    };
  };

  const markAsPaid = async (periodId) => {
    try {
      await PayPeriod.update(periodId, {
        is_paid: true,
        paid_date: format(new Date(), 'yyyy-MM-dd')
      });
      await loadData(); // Reload all data to update the UI
    } catch (error) {
      console.error("Error marking as paid:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const parsedDate = parseISO(dateString);
      return isValid(parsedDate) ? format(parsedDate, 'MMM d, yyyy') : 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const today = new Date();

  // Separate pay periods into "current" (in-progress) and "unpaid" (past due)
  const currentPeriods = payPeriods.filter(p => {
    const periodEnd = parseISO(p.end_date);
    // A period is "current" if it's not yet paid AND its end date is today or in the future
    return !p.is_paid && (isSameDay(periodEnd, today) || isAfter(periodEnd, today));
  });

  const unpaidPeriods = payPeriods.filter(p => {
    const periodEnd = parseISO(p.end_date);
    // A period is "unpaid" (meaning it's past due and needs payment) if it's not paid AND its end date is in the past
    return !p.is_paid && isBefore(periodEnd, today);
  });

  const totalUnpaid = unpaidPeriods.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const yearlyPaid = payPeriods
    .filter(p => p.is_paid && p.paid_date && parseISO(p.paid_date).getFullYear() === new Date().getFullYear())
    .reduce((sum, p) => sum + (p.total_amount || 0), 0);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!activeContract) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            Payroll Management
          </h1>
          <p className="text-gray-600">Track nanny payments and pay periods</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Contract</h3>
            <p className="text-gray-600">Create an active contract first to manage payroll</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-500" />
          Payroll Management
        </h1>
        <p className="text-gray-600">Track bi-weekly nanny payments</p>
        {activeContract && (
          <p className="text-sm text-gray-500">
            Contract: {formatDate(activeContract.start_date)} - {activeContract.end_date ? formatDate(activeContract.end_date) : "Open-ended"}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold">Amount Owed</CardTitle>
              <AlertCircle className="w-6 h-6 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalUnpaid.toFixed(2)}</div>
            <p className="text-red-100 text-sm">{unpaidPeriods.length} unpaid periods</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold">Paid This Year</CardTitle>
              <CheckCircle2 className="w-6 h-6 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${yearlyPaid.toFixed(2)}</div>
            <p className="text-green-100 text-sm">{new Date().getFullYear()} total</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold">Hourly Rate</CardTitle>
              <Clock className="w-6 h-6 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${activeContract?.base_hourly_rate || 0}/hr</div>
            <p className="text-blue-100 text-sm">Bi-weekly periods</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Pay Period */}
      {currentPeriods.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Current Pay Period</h2>
          {currentPeriods.map((period) => (
            <Card key={period.id} className="border-0 shadow-lg bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {period.period_title}
                      </h3>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        In Progress
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-500">Hours Worked</p>
                          <p className="text-sm font-medium">{(period.total_hours || 0).toFixed(1)} hrs</p>
                          {period.overtime_hours > 0 && (
                            <p className="text-xs text-orange-600">
                              {period.overtime_hours.toFixed(1)} overtime
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-500">Amount Earned</p>
                          <p className="text-sm font-medium">${(period.total_amount || 0).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Period</p>
                          <p className="text-sm font-medium">
                            {formatDate(period.start_date)} - {formatDate(period.end_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <p className="text-sm font-medium text-blue-600">Active</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Unpaid Pay Periods */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Unpaid Pay Periods</h2>

        {unpaidPeriods.length > 0 ? (
          unpaidPeriods.map((period) => (
            <Card key={period.id} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {period.period_title}
                      </h3>
                      <Badge variant="destructive">
                        Unpaid
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-500">Total Hours</p>
                          <p className="text-sm font-medium">{(period.total_hours || 0).toFixed(1)} hrs</p>
                          {period.overtime_hours > 0 && (
                            <p className="text-xs text-orange-600">
                              {period.overtime_hours.toFixed(1)} overtime
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="text-sm font-medium">${(period.total_amount || 0).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Period</p>
                          <p className="text-sm font-medium">
                            {formatDate(period.start_date)} - {formatDate(period.end_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <p className="text-sm font-medium">Pending</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => markAsPaid(period.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600 mb-4">There are no unpaid pay periods.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
