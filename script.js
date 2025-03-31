document.addEventListener('DOMContentLoaded', function () {
    // Initialize Materialize components
    M.AutoInit();

    class BusSystem {
        constructor() {
            this.buses = JSON.parse(localStorage.getItem('buses')) || [];
            this.initializeEventListeners();
            this.renderBuses();
        }

        initializeEventListeners() {
            document
                .getElementById('addBusForm')
                .addEventListener('submit', (e) => this.handleAddBus(e));
            document
                .getElementById('reserveForm')
                .addEventListener('submit', (e) => this.handleReserve(e));
            document
                .getElementById('cancelForm')
                .addEventListener('submit', (e) => this.handleCancel(e));
            document
                .getElementById('deleteBusForm')
                .addEventListener('submit', (e) => this.handleDeleteBus(e));
            // Event listener for the Available Seats form
            document
                .getElementById('availableSeatsForm')
                .addEventListener('submit', (e) => this.handleAvailableSeats(e));
        }

        handleAddBus(e) {
            e.preventDefault();
            try {
                this.addBus({
                    number: document.getElementById('busNumber').value,
                    driver: document.getElementById('driver').value,
                    from: document.getElementById('from').value,
                    to: document.getElementById('to').value,
                    arrival: document.getElementById('arrival').value,
                    depart: document.getElementById('depart').value,
                });
                this.showToast('Bus added successfully!', 'green');
                e.target.reset();
            } catch (error) {
                this.showToast(error, 'red');
            }
        }

        handleReserve(e) {
            e.preventDefault();
            try {
                this.reserveSeat(
                    document.getElementById('reserveBusNumber').value,
                    parseInt(document.getElementById('seatNumber').value),
                    document.getElementById('passengerName').value
                );
                this.showToast('Reservation successful!', 'green');
                e.target.reset();
            } catch (error) {
                this.showToast(error, 'red');
            }
        }

        handleCancel(e) {
            e.preventDefault();
            try {
                this.cancelReservation(
                    document.getElementById('cancelBusNumber').value,
                    parseInt(document.getElementById('cancelSeatNumber').value)
                );
                this.showToast('Cancellation successful!', 'green');
                e.target.reset();
            } catch (error) {
                this.showToast(error, 'red');
            }
        }

        handleDeleteBus(e) {
            e.preventDefault();
            try {
              // Get the bus number and trim any extra spaces
              const busNumber = document.getElementById('deleteBusNumber').value.trim();
              this.deleteBus(busNumber);
              this.showToast('Bus deleted successfully!', 'green');
              e.target.reset();
            } catch (error) {
              this.showToast(error, 'red');
            }
          }
          

        handleAvailableSeats(e) {
            e.preventDefault();
            const busNumber = document.getElementById('availableBusNumber').value;
            const container = document.getElementById('availableSeatsContainer');
            container.innerHTML = ''; // Clear previous results
          
            const bus = this.buses.find((b) => b.number === busNumber);
            if (!bus) {
              this.showToast('Bus not found!', 'red');
              return;
            }
          
            // Create a full-width card showing bus details
            const busCard = document.createElement('div');
            busCard.className = 'bus-card';
            busCard.innerHTML = `
              <div class="card">
                <div class="card-content">
                  <span class="card-title">${bus.number} - ${bus.from} to ${bus.to}</span>
                  <p>Driver: ${bus.driver}</p>
                  <p>Timing: ${bus.arrival} - ${bus.depart}</p>
                </div>
              </div>
            `;
            container.appendChild(busCard);
          
            // Create a grid container for all seats arranged like a bus
            const seatGrid = document.createElement('div');
            seatGrid.className = 'bus-seat-grid';
          
            bus.seats.forEach((seat) => {
              const seatEl = document.createElement('div');
              seatEl.style.transition = 'opacity 0.3s ease';
              seatEl.className = 'seat ' + (seat.status === 'available' ? 'available' : 'occupied');
          
              if (seat.status === 'available') {
                // For available seats, simply show the seat number
                seatEl.textContent = seat.number;
              } else {
                // For occupied seats, show the seat number by default
                seatEl.textContent = seat.number;
                // On mouseover: fade out, then change text to display the full passenger name (with line breaks)
                seatEl.addEventListener('mouseover', () => {
                    seatEl.style.opacity = '0';
                    setTimeout(() => {
                      // Format the name with line breaks if it contains spaces
                      let formattedName = seat.passenger.indexOf(' ') !== -1 
                        ? seat.passenger.split(' ').join('<br>')
                        : seat.passenger;
                        
                      // Dynamically calculate font size:
                      // Start with a default font size (0.9em) and decrease based on extra characters.
                      const defaultFontSize = 0.9; // in em
                      const minFontSize = 0.5;     // in em
                      let extraChars = seat.passenger.length - 10; // count characters beyond 10
                      let computedFontSize = defaultFontSize;
                      if (extraChars > 0) {
                        // For every extra character, reduce the font size by 0.05em
                        computedFontSize = Math.max(minFontSize, defaultFontSize - extraChars * 0.05);
                      }
                      
                      seatEl.innerHTML = formattedName;
                      seatEl.style.fontSize = computedFontSize + 'em';
                      seatEl.style.opacity = '1';
                    }, 300); // match the transition duration
                  });
                  
                  seatEl.addEventListener('mouseout', () => {
                    seatEl.style.opacity = '0';
                    setTimeout(() => {
                      seatEl.textContent = seat.number;
                      seatEl.style.fontSize = ''; // reset to default from CSS
                      seatEl.style.opacity = '1';
                    }, 300);
                  });
                  
              }
              seatGrid.appendChild(seatEl);
            });
          
            container.appendChild(seatGrid);
          }
          
          

        addBus(bus) {
            if (this.buses.length >= 5) throw 'Maximum 5 buses allowed!';
            if (this.buses.some((b) => b.number === bus.number))
                throw 'Bus number already exists!';

            this.buses.push({
                ...bus,
                seats: Array.from({ length: 32 }, (_, i) => ({
                    number: i + 1,
                    passenger: null,
                    status: 'available',
                })),
            });
            this.save();
            this.renderBuses();
        }

        reserveSeat(busNumber, seatNumber, passenger) {
            const bus = this.buses.find((b) => b.number === busNumber);
            if (!bus) throw 'Bus not found!';
            if (seatNumber < 1 || seatNumber > 32) throw 'Invalid seat number!';

            const seat = bus.seats[seatNumber - 1];
            if (seat.status !== 'available') throw 'Seat already occupied!';

            seat.passenger = passenger;
            seat.status = 'occupied';
            this.save();
            this.renderBuses();
        }

        cancelReservation(busNumber, seatNumber) {
            const bus = this.buses.find((b) => b.number === busNumber);
            if (!bus) throw 'Bus not found!';
            if (seatNumber < 1 || seatNumber > 32) throw 'Invalid seat number!';

            const seat = bus.seats[seatNumber - 1];
            if (seat.status !== 'occupied') throw 'Seat is not occupied!';

            seat.passenger = null;
            seat.status = 'available';
            this.save();
            this.renderBuses();
        }

        deleteBus(busNumber) {
            // Trim any extra spaces from the input
            busNumber = busNumber.trim();
            // Find the index using trimmed values
            const busIndex = this.buses.findIndex((b) => b.number.trim() === busNumber);
            if (busIndex === -1) throw 'Bus not found!';
            this.buses.splice(busIndex, 1);
            this.save();
            this.renderBuses();
          }
          

        save() {
            localStorage.setItem('buses', JSON.stringify(this.buses));
        }

        // Render buses WITHOUT showing individual seats
        renderBuses() {
            const container = document.getElementById('buses-list');
            container.innerHTML = '';

            this.buses.forEach((bus) => {
                // Calculate total seats and available seats count
                const totalSeats = bus.seats.length;
                const availableSeatsCount = bus.seats.filter(seat => seat.status === 'available').length;

                const busCard = document.createElement('div');
                busCard.className = 'col s12 m6';
                busCard.innerHTML = `
                <div class="card bus-card">
                  <div class="card-content">
                    <span class="card-title">${bus.number} - ${bus.from} to ${bus.to}</span>
                    <p>Driver: ${bus.driver}</p>
                    <p>Timing: ${bus.arrival} - ${bus.depart}</p>
                    <p>Total Seats: ${totalSeats}</p>
                    <p>Available Seats: ${availableSeatsCount}</p>
                  </div>
                </div>
              `;
                container.appendChild(busCard);
            });
        }

        showToast(message, color) {
            const toast = document.createElement('div');
            toast.className = `toast ${color}`;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }

    // Initialize the Bus Reservation System
    new BusSystem();
});
