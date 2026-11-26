package com.lifeos.companion.util

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

object IstClock {
    val ZONE_IST: ZoneId = ZoneId.of("Asia/Kolkata")
    private val DATE_FORMAT: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    fun todayIst(): LocalDate = LocalDate.now(ZONE_IST)

    fun todayIstString(): String = todayIst().format(DATE_FORMAT)

    fun toIstDateString(instant: Instant): String =
        instant.atZone(ZONE_IST).toLocalDate().format(DATE_FORMAT)

    fun nowIsoUtc(): String = Instant.now().toString()
}
